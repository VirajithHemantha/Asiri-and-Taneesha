const scriptUrl = 'https://script.google.com/macros/s/AKfycbyzVAUKe5_W7ozo9YUjaEMNg5pVB5zohIjWjKk7OEVs0wFVizG-eUja70jmqrptO3g3/exec';

export interface SheetWish {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

type SheetPayload =
  | { sheet: 'RSVP'; fullName: string; guests: string; dietaryNotes: string }
  | { sheet: 'WISH'; name: string; message: string };

export async function submitToSheet(payload: SheetPayload): Promise<void> {
  // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight.
  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error || 'The sheet rejected the submission.');
  }
}

export async function fetchWishes(): Promise<SheetWish[]> {
  const response = await fetch(`${scriptUrl}?action=wishes`);
  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error || 'Could not load wishes.');
  }

  return result.wishes ?? [];
}
