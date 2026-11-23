// Many partners identify a guest only after the order, so the email a guest types on the trigger
// page is the only one there is in time. It fills an unresolved `email` key, or replaces a malformed partner value.
// Some checkout forms mark the email field type="text", so any text or email input is a candidate,
// as is one marked autocomplete="email"; hidden and password inputs never are. Only a candidate the
// shopper typed into or autofilled is read, and only a value shaped like an email counts.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.(?:[a-zA-Z]{2,}|xn--[a-zA-Z0-9-]+|[^\s@.\x00-\x7F]{2,})$/;

// Longer values are never emails, and skipping them bounds the pattern's backtracking on fields the shopper didn't fill.
const MAX_EMAIL_LENGTH = 254;

// The form read and the partner value check share this test, so the form never supplies a value the check rejects.
function isEmailShaped(email: string): boolean {
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email);
}

// Candidates whose latest input or change event was a trusted change: the shopper finished typing into or
// autofilled them. A field the shopper never finished never fills the call, and one the shopper edits again or
// a script changes drops out when that input or change event fires, until a trusted change commits it again. A
// blur never restores one, since a script can set the value silently first. A silent script write after the
// shopper's last change is not seen. Holds elements, never values.
const shopperInputs = new WeakSet<HTMLInputElement>();

// Candidates that have heard at least one trusted change event and no untrusted or non-candidate event since.
const committedInputs = new WeakSet<HTMLInputElement>();

// Candidates whose latest input or change event was trusted, including fields currently mid-edit.
const touchedInputs = new WeakSet<HTMLInputElement>();

// Committed candidates the shopper left with a trusted blur after an input that no change followed, as when a
// re-edit ends where it started. The scan settles one that can't hold an email.
const blurredInputs = new WeakSet<HTMLInputElement>();

// Inputs whose latest input or change event was untrusted, dispatched by script. Read only by the email miss reason.
const scriptInputs = new WeakSet<HTMLInputElement>();

// The document and the field each hear one event, and a capture handler between them can change the field and
// announce it. An event can record only when first heard, so it never undoes that drop; a drop always applies.
const heardEvents = new WeakSet<Event>();

// `type` reads "text" for a missing or unknown type attribute.
function isEmailCandidate(target: EventTarget | null): target is HTMLInputElement {
  if (!(target instanceof HTMLInputElement)) return false;
  const type = target.type;
  return (
    type === 'text' ||
    type === 'email' ||
    (target.getAttribute('autocomplete') === 'email' && type !== 'hidden' && type !== 'password')
  );
}

// Records an input on a trusted change event while it is a candidate, and drops it on any other, whatever its
// type then. A trusted blur drops a field no change committed, and marks a committed one left mid-edit. Reads no
// value.
export function recordShopperInput(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (event.type === 'blur' || event.type === 'focusout') {
    // A script's blur says nothing about the shopper. A trusted one can follow a silent script write, so it
    // never marks a field finished either: only a trusted change does.
    if (event.isTrusted !== true) return;
    if (!isEmailCandidate(target) || !committedInputs.has(target)) {
      shopperInputs.delete(target);
      touchedInputs.delete(target);
    } else if (!shopperInputs.has(target)) {
      blurredInputs.add(target);
    }
    return;
  }
  const firstHearing = !heardEvents.has(event);
  heardEvents.add(event);
  if (event.isTrusted !== true) {
    scriptInputs.add(target);
    shopperInputs.delete(target);
    committedInputs.delete(target);
    touchedInputs.delete(target);
    blurredInputs.delete(target);
    return;
  }
  if (firstHearing) scriptInputs.delete(target);
  if (!isEmailCandidate(target)) {
    shopperInputs.delete(target);
    committedInputs.delete(target);
    touchedInputs.delete(target);
    blurredInputs.delete(target);
    return;
  }
  if (!firstHearing) return;
  touchedInputs.add(target);
  blurredInputs.delete(target);
  // The field hears its own events even while detached from the page, where the document listener can't.
  target.addEventListener('input', recordShopperInput, true);
  target.addEventListener('change', recordShopperInput, true);
  if (event.type === 'change') {
    shopperInputs.add(target);
    committedInputs.add(target);
  } else {
    shopperInputs.delete(target);
  }
}

// A change on an explicit email input, or on a text input that now holds an email.
export function isEmailInput(target: EventTarget | null): boolean {
  return (
    isEmailCandidate(target) &&
    (target.type === 'email' ||
      target.getAttribute('autocomplete') === 'email' ||
      isEmailShaped(target.value.trim()))
  );
}

// A partner value under the email key that isn't shaped like an email, as a page sends when it identifies the shopper
// mid-typing. The shopper's committed form email may replace it; any value shaped like an email stays.
export function isMalformedEmail(value: string): boolean {
  return !isEmailShaped(value.trim());
}

function mayHoldEmail(input: HTMLInputElement): boolean {
  return input.type === 'email' || input.getAttribute('autocomplete') === 'email' || input.value.includes('@');
}

// A committed field the shopper re-edited stays unsettled until a change commits it, unless they blurred it, it no
// longer has focus and it can't hold an email: a re-edit that ends where it started fires no change, and a name field
// left that way would otherwise hide the shopper's email for the rest of the page. A window or tab blur leaves the
// field focused and mid-edit, so it stays unsettled.
function isUnsettledEmailInput(input: HTMLInputElement): boolean {
  return (
    mayHoldEmail(input) ||
    (committedInputs.has(input) &&
      !shopperInputs.has(input) &&
      !(blurredInputs.has(input) && input !== document.activeElement))
  );
}

// One pass over the candidates. Collects the shopper-filled emails keyed in lower case; with testUnfilled, also says
// how an email-shaped value reached a field the shopper didn't fill. That value is only tested, never kept.
export function scanFormEmails(testUnfilled: boolean): {
  emails: Map<string, string>;
  ambiguous: boolean;
  unfilled?: 'untrusted_fill' | 'uncommitted_fill' | 'unseen_fill';
} {
  const emails = new Map<string, string>();
  const unfilledCandidates: HTMLInputElement[] = [];
  let unsettledTouched = 0;
  let overlongEmail = false;
  document.querySelectorAll('input').forEach((input) => {
    if (!isEmailCandidate(input)) return;
    const filled = shopperInputs.has(input);
    const touched = touchedInputs.has(input);
    if (!filled) {
      if (touched && isUnsettledEmailInput(input)) unsettledTouched += 1;
      if (testUnfilled) unfilledCandidates.push(input);
      return;
    }
    const value = input.value.trim();
    if (isEmailShaped(value)) {
      if (!emails.has(value.toLowerCase())) emails.set(value.toLowerCase(), value);
    } else if (value.length > MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(value)) {
      // Too long to send, but still an address the shopper typed, so another field's email isn't theirs alone.
      overlongEmail = true;
    }
  });
  const ambiguous = emails.size > 0 && (unsettledTouched > 0 || overlongEmail);
  let unfilled: 'untrusted_fill' | 'uncommitted_fill' | 'unseen_fill' | undefined;
  if (testUnfilled && !ambiguous && emails.size === 0) {
    unfilledCandidates.forEach((input) => {
      const value = input.value.trim();
      if (!isEmailShaped(value)) return;
      if (scriptInputs.has(input)) {
        unfilled = 'untrusted_fill';
      } else if (unfilled !== 'untrusted_fill') {
        if (touchedInputs.has(input) || input === document.activeElement) {
          unfilled = 'uncommitted_fill';
        } else if (unfilled !== 'uncommitted_fill') {
          unfilled = 'unseen_fill';
        }
      }
    });
  }
  return { emails, ambiguous, unfilled };
}

// The one email across the candidates on the page that the shopper typed into or autofilled, trimmed and
// otherwise as typed. Inputs differing only in case or spacing (email and confirm email) count as one; two
// different emails, such as a gift recipient's beside the shopper's, are ambiguous and read nothing.
export function readFormEmail(): string | undefined {
  const { emails, ambiguous } = scanFormEmails(false);
  return emails.size === 1 && !ambiguous ? emails.values().next().value : undefined;
}

