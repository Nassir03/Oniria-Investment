import Link from 'next/link';
export default function NotFound(){return <main className="notFoundPage"><p className="eyebrow">404</p><h1>This place has not been created yet.</h1><p>The page you requested is not available on the ONIRIA website.</p><Link className="button buttonNavy" href="/" prefetch>Return home <span>→</span></Link></main>}
