import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand-name">Estat<span>ly</span></div>
          <p className="footer-desc">Premium real estate platform connecting buyers, sellers, and agents with extraordinary properties.</p>
        </div>
        <div>
          <div className="footer-col-title">Properties</div>
          <ul className="footer-links">
            <li><Link to="/listings?listing_type=sale">For Sale</Link></li>
            <li><Link to="/listings?listing_type=rent">For Rent</Link></li>
            <li><Link to="/listings?property_type=house">Houses</Link></li>
            <li><Link to="/listings?property_type=condo">Condos</Link></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Company</div>
          <ul className="footer-links">
            <li><a href="#">About Us</a></li>
            <li><a href="#">Agents</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">Support</div>
          <ul className="footer-links">
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Estatly. All rights reserved.</span>
        <span>Made with ♥ for homeowners everywhere</span>
      </div>
    </footer>
  );
}
