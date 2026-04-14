/**
 * AI Clinical Assistant Agent Service
 * Calls Azure OpenAI-based clinical assistant for SOAP note suggestions
 */

const AGENT_ENDPOINT = process.env.AI_AGENT_ENDPOINT;
const AGENT_API_KEY = process.env.AI_AGENT_API_KEY;
const AGENT_TIMEOUT = parseInt(process.env.AI_AGENT_TIMEOUT || '35000'); // 35 seconds default

/**
 * Call AI Agent with clinical data to get SOAP suggestions
 * @param {string} clinicalData - Clinical information to analyze
 * @returns {Promise<string>} - AI response text
 * @throws {Error} - If agent fails or times out
 */
export async function callClinicalAgent(clinicalData) {
  try {
    if (!AGENT_ENDPOINT || !AGENT_API_KEY) {
      throw new Error('AI Agent configuration missing: AGENT_ENDPOINT or AGENT_API_KEY not set');
    }


    // Set up timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AGENT_TIMEOUT);

    try {
      const response = await fetch(AGENT_ENDPOINT, {
        method: 'POST',
        headers: {
          'api-key': AGENT_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: clinicalData,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Agent API error: ${response.status} ${response.statusText}\n${errorText}`
        );
      }

      const result = await response.json();
      const agentResponse = extractAgentResponse(result);

      return agentResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Agent request timeout after ${AGENT_TIMEOUT}ms`);
      }

      throw error;
    }
  } catch (error) {
    console.error('❌ Clinical Agent Error:', error.message);
    throw error;
  }
}

/**
 * Extract agent response from various response formats
 * @param {any} result - Raw response from agent API
 * @returns {string} - Extracted response text
 */
function extractAgentResponse(result) {
  try {
    // Format 1: Array of messages with content blocks
    if (Array.isArray(result) && result[0]?.content) {
      const contentArray = result[0].content;
      if (Array.isArray(contentArray) && contentArray[0]) {
        const contentBlock = contentArray[0];

        if (contentBlock.text) return contentBlock.text;
        if (contentBlock.message) return contentBlock.message;
        if (contentBlock.content) return contentBlock.content;
        if (typeof contentBlock === 'string') return contentBlock;

        return JSON.stringify(contentBlock, null, 2);
      }
      return JSON.stringify(contentArray, null, 2);
    }

    // Format 2: output field
    if (result.output) {
      return result.output;
    }

    // Format 3: OpenAI choices format
    if (result.choices?.[0]?.message?.content) {
      return result.choices[0].message.content;
    }

    // Format 4: Fallback to JSON string
    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.error('Error extracting agent response:', error.message);
    throw new Error('Failed to parse agent response format');
  }
}

/**
 * Parse agent response into structured SOAP suggestions
 * Expects response in JSON format with subjective, objective, assessment, plan
 * @param {string} agentResponse - Raw response from agent
 * @returns {object} - Parsed SOAP suggestions
 */
export function parseSoapSuggestions(agentResponse) {
  try {
    let jsonString = agentResponse;


    // Helper to extract text from a message model
    const extractFromMessage = (msg) => {
      if (!msg) return null;
      
      // Direct Anthropic / Claude output format
      if (Array.isArray(msg)) {
        msg = msg.find(m => m.role === 'assistant' || m.type === 'message') || msg[0];
      }
      
      if (msg && msg.content && Array.isArray(msg.content)) {
        const textContent = msg.content.find(c => c.type === 'text' || c.type === 'output_text' || c.text);
        if (textContent) return textContent.text || textContent;
      }
      
      if (msg && msg.text) return msg.text;
      
      return null;
    }

    // Attempt to stringify/extract text from whatever we received
    if (typeof agentResponse === 'object' && agentResponse !== null) {
      jsonString = extractFromMessage(agentResponse) || JSON.stringify(agentResponse);
    } else if (typeof agentResponse !== 'string') {
      jsonString = JSON.stringify(agentResponse);
    }


    // Initial parse of the string
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      else throw e;
    }

    // Now, if `parsed` contains the Claude message wrapper (because the AI returned it inside), 
    // we need to dig into it. In the user log, `parsed` has a `structured_soap` key that is an array
    if (parsed.structured_soap && Array.isArray(parsed.structured_soap)) {
      const embeddedText = extractFromMessage(parsed.structured_soap);
      if (embeddedText) {
        try {
          parsed = JSON.parse(embeddedText);
        } catch(e) {
          const deeperMatch = embeddedText.match(/\{[\s\S]*\}/);
          if (deeperMatch) parsed = JSON.parse(deeperMatch[0]);
        }
      }
    } else if (parsed && Array.isArray(parsed)) {
      const embeddedText = extractFromMessage(parsed);
      if (embeddedText) {
        try {
          parsed = JSON.parse(embeddedText);
        } catch(e) { }
      }
    }

    // Extract structured_soap - this is what the frontend expects
    const soap = parsed.structured_soap || parsed;
    

    // Return in the format the frontend expects: with structured_soap as the main payload
    return {
      success: true,
      structured_soap: soap,  // Return the full structured_soap object for frontend
      subjective: soap.subjective || null,
      objective: soap.objective || null,
      assessment: soap.assessment || null,
      plan: soap.plan || null,
      differentialDiagnoses: parsed.differential_diagnoses || soap.differential_diagnoses || [],
      medicationRecommendations: parsed.medication_recommendations || soap.medication_recommendations || [],
      rawResponse: jsonString,
    };
  } catch (parseError) {
    console.error('❌ Parse error:', parseError?.message);
    
    // If it's a completely failed parse, return the raw data so at least something shows
    return {
      success: true,
      structured_soap: null,
      subjective: null,
      objective: null,
      assessment: typeof agentResponse === 'string' ? agentResponse : JSON.stringify(agentResponse),
      plan: null,
      differentialDiagnoses: [],
      medicationRecommendations: [],
      rawResponse: typeof agentResponse === 'string' ? agentResponse : JSON.stringify(agentResponse),
    };
  }
}
