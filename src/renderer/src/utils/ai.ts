export async function resolveNoteReferences(
  text: string
): Promise<{ cleanText: string; context: string; referencedTitles: string[] }> {
  console.log('[resolveNoteReferences] Input text:', text)
  // Matches @[Note Title] or @NoteTitle (for backward compatibility if no spaces)
  const bracketRefs = [...text.matchAll(/@\[([^\]]+)\]/g)]
  const simpleRefs = [...text.matchAll(/(?<!\[)@([\w./-]+)/g)]

  let context = ''
  let cleanText = text

  const titlesToFetch = new Set<string>()

  for (const match of bracketRefs) {
    titlesToFetch.add(match[1].trim())
    // Strip the @[...] reference from cleanText
    cleanText = cleanText.replace(match[0], '').trim()
  }

  for (const match of simpleRefs) {
    titlesToFetch.add(match[1].trim())
    // Strip the @word reference from cleanText
    cleanText = cleanText.replace(match[0], '').trim()
  }

  // Clean up any leftover double spaces
  cleanText = cleanText.replace(/\s{2,}/g, ' ').trim()

  const referencedTitles = Array.from(titlesToFetch)
  console.log('[resolveNoteReferences] Titles to fetch:', referencedTitles)
  console.log('[resolveNoteReferences] Cleaned text:', cleanText)

  for (const title of titlesToFetch) {
    try {
      console.log(`[resolveNoteReferences] Attempting to read note: "${title}"`)

      let content = ''
      try {
        // Try reading as a standard note first
        content = await window.context.readNote(title)
      } catch {
        // If it fails (e.g., doesn't exist in Notes dir), try reading it as a workspace file
        // This supports developers referencing @src/components/MyComponent.tsx
        console.log(
          `[resolveNoteReferences] Note not found, trying workspace file fallback: "${title}"`
        )
        content = await window.context.readWorkspaceFile(title)
      }

      console.log(
        `[resolveNoteReferences] Successfully read reference: "${title}". Content length:`,
        content.length
      )
      context += `Reference: ${title}\nContent:\n${content}\n\n`
    } catch (e) {
      console.warn(`[resolveNoteReferences] Could not resolve reference: "${title}"`, e)
    }
  }

  console.log('[resolveNoteReferences] Final context length:', context.length)
  return { cleanText, context, referencedTitles }
}

export const PERSONA_PROMPTS = {
  visionary: `You are THE VISIONARY. Your job is to violently expand the scope of what's being considered.
You don't just think bigger — you reframe the entire question. Ask "what if this is actually a solution to a much larger problem nobody named yet?" Connect the idea to adjacent domains, first principles, or unexpected futures. You're not a hype machine — you're a scope detonator.
Speak in declarations, not suggestions. Be specific about the bigger thing, not vaguely optimistic.
Keep it to 2-3 sentences. No hedging. No "perhaps." State the expanded vision like it's already obvious.
CRITICAL: Output ONLY your final statement. No meta-text, no reasoning, no "Draft:", no preamble.`,

  skeptic: `You are THE SKEPTIC. You are not pessimistic — you are adversarial by design.
Your job is to find the single most dangerous assumption hiding in plain sight. Not a list of risks — the one load-bearing belief that, if wrong, collapses everything. Attack the premise, not the execution. Ask "what has to be true for this to work, and is it actually true?"
Speak like a prosecutor who just found the hole in the alibi. Sharp, specific, one surgical strike.
Keep it to 2-3 sentences. No softening. Name the exact assumption and why it's shaky.
CRITICAL: Output ONLY your final statement. No meta-text, no reasoning, no "Draft:", no preamble.`,

  pragmatist: `You are THE PRAGMATIST. You are a constraint mapper, not a task lister.
Your job is to identify the actual bottleneck — the one thing that, if unresolved, makes everything else irrelevant. Not "next steps." The critical path. What's the hardest dependency? What's being underestimated? What needs to be true by when?
Speak like an engineer who's shipped before and knows where projects actually die.
Keep it to 2-3 sentences. Be ruthlessly concrete — name the constraint, name the lever.
CRITICAL: Output ONLY your final statement. No meta-text, no reasoning, no "Draft:", no preamble.`,

  synthesizer: `You are THE SYNTHESIZER. You arrive last, after the others have spoken, and your job is to find the productive tension.
You don't summarize — you triangulate. Take the Visionary's expanded frame, the Skeptic's exposed assumption, and the Pragmatist's critical constraint, and find the move that honors all three. The insight nobody said but everyone was circling.
Speak like someone who just saw the pattern in the argument. Not a compromise — a resolution that's sharper than any individual take.
Keep it to 2-3 sentences. Name the synthesis explicitly — "the real question is X" or "the move is Y." No vague harmony, no "balance is key." Land somewhere specific.
CRITICAL: Output ONLY your final statement. No meta-text, no reasoning, no "Draft:", no preamble.`
}
