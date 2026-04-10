
/**
 * Get all doctors for a specific department including their staff details
 */
export async function getDoctorsForDepartment(departmentId) {
  let connection;
  try {
    connection = await db.getConnection();

    const [doctors] = await connection.query(
      `SELECT 
        d.doctor_id,
        d.staff_id,
        d.specialization,
        d.consultation_fee,
        s.first_name as staff_first_name,
        s.last_name as staff_last_name,
        s.employee_id,
        dep.department_name
      FROM doctors d
      JOIN staff s ON d.staff_id = s.staff_id
      JOIN departments dep ON s.department_id = dep.department_id
      WHERE s.department_id = ? 
      AND s.status = 'Active'
      ORDER BY s.first_name, s.last_name`,
      [departmentId]
    );

    return doctors;
  } catch (error) {
    throw new Error(`Failed to fetch doctors for department: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get available time slots for a doctor on a specific date
 * Generates 30-minute slots based on doctor's availability and existing appointments
 */
export async function getAvailableTimeSlots(doctorId, appointmentDate) {
  let connection;
  try {
    connection = await db.getConnection();

    // Get doctor's availability for the day of week
    const dayOfWeek = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long' });

    const [availability] = await connection.query(
      `SELECT shift_start_time, shift_end_time
       FROM doctor_availability
       WHERE doctor_id = ? AND day_of_week = ? AND is_working = true`,
      [doctorId, dayOfWeek]
    );

    if (!availability.length) {
      return []; // Doctor not available on this day
    }

    const { shift_start_time, shift_end_time } = availability[0];

    // Get booked appointments for this doctor on this date
    const [bookedSlots] = await connection.query(
      `SELECT appointment_time
       FROM appointments
       WHERE doctor_id = ? 
       AND appointment_date = ? 
       AND status != 'Cancelled'
       AND is_deleted = false`,
      [doctorId, appointmentDate]
    );

    const bookedTimes = new Set(bookedSlots.map(slot => slot.appointment_time));

    // Generate 30-minute slots between shift times
    const slots = [];
    const [startHours, startMin] = shift_start_time.split(':').map(Number);
    const [endHours, endMin] = shift_end_time.split(':').map(Number);

    let currentHours = startHours;
    let currentMin = startMin;
    const endTotalMin = endHours * 60 + endMin;

    while (currentHours * 60 + currentMin < endTotalMin) {
      const timeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}:00`;
      
      // Only add if not already booked
      if (!bookedTimes.has(timeStr)) {
        slots.push(timeStr.substring(0, 5)); // Return HH:MM format
      }

      currentMin += 30;
      if (currentMin >= 60) {
        currentMin -= 60;
        currentHours += 1;
      }
    }

    return slots;
  } catch (error) {
    throw new Error(`Failed to fetch available time slots: ${error.message}`);
  } finally {
    if (connection) connection.release();
  }
}
