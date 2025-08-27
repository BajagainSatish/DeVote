"use client";
import { Shield, Github, Twitter, Mail } from "lucide-react";
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-white text-gray-700 shadow-inner mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-8 h-8 text-emerald-600" />
              <span className="text-xl font-bold text-gray-900">DeVote</span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              A secure, transparent, and decentralized voting system built on
              blockchain technology. Ensuring every vote counts and can be
              verified.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-500 hover:text-emerald-600 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-emerald-600 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-emerald-600 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-600 hover:text-emerald-600">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/blockchain"
                  className="text-gray-600 hover:text-emerald-600"
                >
                  Blockchain Explorer
                </a>
              </li>
              <li>
                <a
                  href="/vote"
                  className="text-gray-600 hover:text-emerald-600"
                >
                  Cast Vote
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-emerald-600">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-emerald-600">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-emerald-600">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-emerald-600">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-300 mt-8 pt-6 text-center">
          <p className="text-gray-500">
            © 2025 DeVote. All rights reserved. Built with transparency and
            security in mind.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
