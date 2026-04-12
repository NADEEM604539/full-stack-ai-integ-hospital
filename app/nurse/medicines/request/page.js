'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * GET: /nurse/medicines/request?encounterId=XXX&appointmentId=XXX
 * Nurse requests medicines for patient encounter
 */
export default function RequestMedicinesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const encounterId = parseInt(searchParams?.get('encounterId'));
  const appointmentId = parseInt(searchParams?.get('appointmentId'));

  const [encounter, setEncounter] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Initialize with one empty medicine row
  const [form, setForm] = useState([
    { medicineId: '', medicineName: '', quantity: 1, unitPrice: 0, notes: '' }
  ]);

  useEffect(() => {
    if (!encounterId) {
      setMessage('Encounter ID is required');
      setMessageType('error');
      setLoading(false);
      return;
    }

    fetchEncounterAndInventory();
  }, [encounterId]);

  async function fetchEncounterAndInventory() {
    try {
      // Fetch encounter details
      const encRes = await fetch(`/api/nurse/encounters/${encounterId}`);
      if (!encRes.ok) throw new Error('Failed to fetch encounter');
      const encData = await encRes.json();
      setEncounter(encData.data);

      // Fetch available medicines/inventory
      const invRes = await fetch('/api/nurse/inventory');
      if (invRes.ok) {
        const invData = await invRes.json();
        setInventoryItems(invData.data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage(error.message || 'Failed to load encounter');
      setMessageType('error');
      setLoading(false);
    }
  }

  function handleMedicineChange(index, field, value) {
    const newForm = [...form];
    newForm[index][field] = value;

    // If selecting medicine by ID, populate name and price
    if (field === 'medicineId' && value) {
      const selected = inventoryItems.find(item => item.item_id === parseInt(value));
      if (selected) {
        newForm[index].medicineName = selected.item_name;
        newForm[index].unitPrice = selected.unit_price;
      }
    }

    setForm(newForm);
  }

  function addMedicineRow() {
    setForm([
      ...form,
      { medicineId: '', medicineName: '', quantity: 1, unitPrice: 0, notes: '' }
    ]);
  }

  function removeMedicineRow(index) {
    if (form.length > 1) {
      setForm(form.filter((_, i) => i !== index));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate
    const validMedicines = form.filter(m => m.medicineId && m.quantity > 0);
    if (validMedicines.length === 0) {
      setMessage('Please add at least one medicine');
      setMessageType('error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/nurse/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounterId,
          appointmentId,
          medicines: validMedicines
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to create order');

      setMessage('Medicine request created successfully! Pharmacist will review shortly.');
      setMessageType('success');

      setTimeout(() => {
        router.push('/nurse/medicines');
      }, 2000);
    } catch (error) {
      console.error('Error submitting:', error);
      setMessage(error.message || 'Failed to create medicine order');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading encounter...</p>
      </div>
    );
  }

  if (!encounter) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Encounter not found</p>
          <Link href="/nurse/medicines" className="text-red-600 hover:underline mt-2">
            Back to Medicine Requests
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount = form.reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Request Medicines</h1>

      {/* Encounter Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Encounter Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Patient Name</p>
            <p className="font-semibold text-gray-900">{encounter.first_name} {encounter.last_name}</p>
          </div>
          <div>
            <p className="text-gray-600">MRN</p>
            <p className="font-semibold text-gray-900">{encounter.mrn}</p>
          </div>
          <div>
            <p className="text-gray-600">Encounter Type</p>
            <p className="font-semibold text-gray-900">{encounter.encounter_type}</p>
          </div>
          <div>
            <p className="text-gray-600">Chief Complaint</p>
            <p className="font-semibold text-gray-900">{encounter.chief_complaint || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 mb-6 ${messageType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={messageType === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message}
          </p>
        </div>
      )}

      {/* Medicine Request Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Medicines</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left p-3 font-semibold">Medicine</th>
                <th className="text-left p-3 font-semibold">Quantity</th>
                <th className="text-left p-3 font-semibold">Unit Price</th>
                <th className="text-left p-3 font-semibold">Total</th>
                <th className="text-left p-3 font-semibold">Notes</th>
                <th className="text-center p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {form.map((medicine, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <select
                      value={medicine.medicineId}
                      onChange={(e) => handleMedicineChange(index, 'medicineId', e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                      required
                    >
                      <option value="">Select medicine</option>
                      {inventoryItems.map(item => (
                        <option key={item.item_id} value={item.item_id}>
                          {item.item_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="1"
                      value={medicine.quantity}
                      onChange={(e) => handleMedicineChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full p-2 border rounded text-sm"
                      required
                    />
                  </td>
                  <td className="p-3 text-right font-mono">
                    PKR {medicine.unitPrice.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold">
                    PKR {(medicine.quantity * medicine.unitPrice).toFixed(2)}
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      placeholder="e.g., For fever"
                      value={medicine.notes}
                      onChange={(e) => handleMedicineChange(index, 'notes', e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeMedicineRow(index)}
                      disabled={form.length === 1}
                      className="text-red-600 hover:text-red-800 disabled:text-gray-300 text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Medicine Button */}
        <button
          type="button"
          onClick={addMedicineRow}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
        >
          + Add Medicine
        </button>

        {/* Total Summary */}
        <div className="mt-6 border-t pt-4">
          <div className="text-right">
            <p className="text-gray-600 mb-2">Subtotal</p>
            <p className="text-2xl font-bold text-gray-900">
              PKR {totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded"
          >
            {submitting ? 'Submitting...' : 'Submit Order for Approval'}
          </button>
          <Link
            href="/nurse/medicines"
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-3 rounded text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
