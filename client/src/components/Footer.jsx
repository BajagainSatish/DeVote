import React from "react";

const Footer = () => {
  return (
    <footer className="py-6 text-center bg-[#F5F5F5] text-xs text-gray-500 border-t border-gray-300">
      © {new Date().getFullYear()} DeVote. All rights reserved.
    </footer>
  );
};

export default Footer;
