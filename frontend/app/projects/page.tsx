import BusinessPage from '../business/page';

export const metadata = { title: 'Projects' };

// Reuse the established projects/business presentation directly at /projects.
// This removes the previous redirect round-trip and keeps the page content intact.
export default BusinessPage;
