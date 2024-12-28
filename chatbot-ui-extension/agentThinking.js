// Agent thinking patterns and prompts
const AGENT_THINKING = {
    // System initialization prompt
    SYSTEM_INIT: `You are an AI assistant with computer vision and web interaction capabilities.
Your role is to:
1. Carefully analyze each screenshot before taking action
2. Understand the current page context and available elements
3. Plan and execute appropriate actions
4. Verify results through visual feedback

Key Responsibilities:
- Always describe what you see in the screenshot
- Explain your reasoning for each action
- Verify results after each action
- Adapt to errors and unexpected states`,

    // Analysis prompts
    VISUAL_ANALYSIS: {
        PAGE_STATE: (pageInfo) => `
Current Page Analysis:
- Type: ${pageInfo.type}
- URL: ${pageInfo.url}
- Available Elements:
  * Search Inputs: ${pageInfo.elements?.searchInputs?.length || 0}
  * Buttons: ${pageInfo.elements?.buttons?.length || 0}
  * Forms: ${pageInfo.elements?.forms?.length || 0}

Please analyze the screenshot and describe:
1. What elements you can see
2. What interactions are possible
3. Any potential challenges or limitations`,

        ACTION_VERIFICATION: (beforeState, afterState, action) => `
Action Verification Required:
- Action Performed: ${action}
- Previous Page: ${beforeState.type} at ${beforeState.url}
- Current Page: ${afterState.type} at ${afterState.url}

Please analyze the new screenshot and confirm:
1. Did the action complete successfully?
2. Are we in the expected state?
3. What elements are now available?
4. Should we proceed with the next action?`,

        ERROR_ANALYSIS: (error, pageInfo) => `
Error Analysis Required:
- Error: ${error}
- Current Page: ${pageInfo.type} at ${pageInfo.url}

Please analyze the current state and advise:
1. What caused the error?
2. What alternative approaches are available?
3. How should we proceed?`
    },

    // Decision making patterns
    DECISION_MAKING: {
        ACTION_SELECTION: (elements, goal) => `
Goal: ${goal}
Available Elements:
${JSON.stringify(elements, null, 2)}

Please determine:
1. What action will best achieve the goal?
2. Which element should we interact with?
3. What verification steps are needed?`,

        RECOVERY_STRATEGY: (error, history) => `
Error Recovery Needed:
${error}

Previous Actions:
${history.map(h => `- ${h.action}: ${h.result}`).join('\n')}

Please suggest:
1. Alternative approach to achieve the goal
2. Steps to verify the new approach
3. Fallback options if needed`
    },

    // Task progress tracking
    PROGRESS_TRACKING: {
        STEP_SUMMARY: (step, maxSteps, currentState) => `
Progress: Step ${step}/${maxSteps}
Current State: ${currentState.type} at ${currentState.url}

Please provide:
1. Summary of progress so far
2. Next steps needed
3. Any potential risks or challenges`,

        TASK_COMPLETION: (history, goal) => `
Task Review:
Goal: ${goal}
Steps Taken: ${history.length}

Please verify:
1. Has the goal been achieved?
2. Are there any loose ends?
3. Should we perform any final verification?`
    },

    // Helper functions for agent decision making
    helpers: {
        // Analyze visual changes between states
        analyzeChanges: (before, after) => {
            const changes = {
                urlChanged: before.url !== after.url,
                typeChanged: before.type !== after.type,
                elementChanges: {
                    searchInputs: after.elements?.searchInputs?.length - (before.elements?.searchInputs?.length || 0),
                    buttons: after.elements?.buttons?.length - (before.elements?.buttons?.length || 0),
                    forms: after.elements?.forms?.length - (before.elements?.forms?.length || 0)
                }
            };

            return {
                changes,
                significance: changes.urlChanged || changes.typeChanged ? 'high' : 'low',
                summary: `Changes detected:
- URL: ${changes.urlChanged ? 'Changed' : 'Same'}
- Page Type: ${changes.typeChanged ? 'Changed' : 'Same'}
- Element Changes: ${JSON.stringify(changes.elementChanges)}`
            };
        },

        // Determine if current state matches expected state
        validateState: (current, expected) => {
            const matches = {
                url: current.url.includes(expected.url),
                type: current.type === expected.type,
                elements: current.elements?.searchInputs?.length >= (expected.elements?.searchInputs?.length || 0)
            };

            return {
                isValid: Object.values(matches).every(v => v),
                mismatches: Object.entries(matches)
                    .filter(([_, v]) => !v)
                    .map(([k]) => k)
            };
        },

        // Generate next action based on current state and goal
        suggestNextAction: (currentState, goal, history) => {
            // Implementation would contain logic to suggest next best action
            // based on current state, goal, and action history
        }
    }
};

// Export the agent thinking patterns
export default AGENT_THINKING; 