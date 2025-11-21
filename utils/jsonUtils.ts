
export const parseGeminiJson = (text: string): any | null => {
    // Find the start and end of the JSON block
    const jsonRegex = /```json\s*([\s\S]*?)\s*```|({[\s\S]*})|(\[[\s\S]*\])/;
    const match = text.match(jsonRegex);

    if (match) {
        // Prioritize the captured group from ```json ... ```, then object, then array
        const jsonString = match[1] || match[2] || match[3];
        if (jsonString) {
            try {
                return JSON.parse(jsonString);
            } catch (error) {
                console.error("Failed to parse extracted JSON string:", error);
                console.error("Extracted string was:", jsonString);
                return null;
            }
        }
    }
    
    // Fallback for cases where the whole string might be the JSON
    try {
        return JSON.parse(text);
    } catch (error) {
         console.error("Failed to parse the entire text as JSON:", error);
         console.error("Original text was:", text);
    }

    return null;
};
