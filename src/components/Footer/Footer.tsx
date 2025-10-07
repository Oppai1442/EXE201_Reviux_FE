import React from "react";
import { Link } from "react-router-dom";
import { Assets } from "@/assets";
import { ROUTES } from "@/constant/routes";
import { scrollToTop } from "@/utils/scrolls";
import { useTranslation } from "react-i18next";

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
    <footer className="bg-gray-950 text-white relative overflow-hidden py-12 bg-gray-900/50 border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-light text-white mb-4">
              <span className="text-cyan-400">Revi</span>ux
            </div>
            <p className="text-gray-400 font-light">
              Premium testing solutions for modern software development
            </p>
          </div>
          <div>
            <h3 className="text-white font-light mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-300">Functional Testing</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-300">Performance Testing</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-300">Security Testing</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-300">Automation</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-light mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-300">About</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-300">Team</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-300">Careers</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-300">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-light mb-4">Connect</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-300">LinkedIn</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-300">Twitter</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-300">GitHub</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-300">Blog</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800/50 text-center text-gray-400 font-light">
          <p>&copy; 2025 Reviux. All rights reserved.</p>
        </div>
      </div>
    </footer>

    </>
  );
};

export default Footer;
