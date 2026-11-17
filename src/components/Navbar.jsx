import { NavLink, Link } from 'react-router-dom';
export default function Navbar(){
 return <header className="site-header">
  <Link aria-label="AID home" className="brand" to="/"><span className="brand-mark"><i></i><i></i></span><b>AID</b><span className="brand-descriptor">AFRICA INFRASTRUCTURES<br/>DÉVELOPPEMENT</span></Link>
  <button aria-expanded="false" aria-label="Open navigation" className="menu-toggle" type="button">☰</button>
  <nav aria-label="Main navigation" className="main-nav">
   <NavLink end to="/">Home</NavLink><NavLink to="/company">Company</NavLink><NavLink to="/capabilities">Capabilities</NavLink><NavLink to="/projects">Projects</NavLink><NavLink to="/careers">Careers</NavLink><NavLink to="/contact">Contact</NavLink>
  </nav>
  <Link className="header-cta" to="/contact">Start a conversation <span>↗</span></Link>
 </header>;
}
