/**
 * The hero walkthrough, as data.
 *
 * `target` is the `data-tour` attribute on the element to spotlight. That
 * contract exists because the controls cannot be selected reliably any other
 * way: `.heroprompt__pill` matches three elements once the mic renders, and the
 * mic is absent on Firefox, which shifts every positional index in the row.
 *
 * `title` keeps the walkthrough's own wording; `body` names the control as it is
 * actually labelled on screen, so the reader can find it. No UI string changes
 * to match the tour — the tour matches the UI.
 */
export const heroTourSteps = [
  {
    id: 'brief',
    target: 'hero-brief',
    title: 'Your campaign brief',
    body: 'Describe the exact product or service, and the brand it belongs to. The more specific the brief, the closer the variants land.',
  },
  {
    id: 'links',
    target: 'hero-links',
    title: 'Add your website & brand references',
    body: 'Use “Add Reference Links” to share your website and social pages, so the studio can learn your brand, products and visual identity.',
  },
  {
    id: 'files',
    target: 'hero-files',
    title: 'Add reference campaigns',
    body: 'Use “Upload Reference Files” for past campaigns, images or PDFs that show the creative direction you are after.',
  },
  {
    id: 'generate',
    target: 'hero-generate',
    /* Acknowledges that Generate is greyed out while the brief is empty — which
       is exactly the state a first-run tour finds it in. Pretending otherwise
       would spotlight what looks like a broken button. */
    title: 'Let the studio do the work',
    body: 'Once your brief is in, Generate lights up. The studio reads everything you have given it and returns four campaign variants.',
  },
]
