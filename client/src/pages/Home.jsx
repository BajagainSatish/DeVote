import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HeroImg from "../assets/VotingBallot.svg";
import Secure from "../assets/Secure.svg";
import Fast from "../assets/Fast.svg";
import Transparent from "../assets/Transparent.svg";
import Register from "../assets/Register.svg";
import Vote from "../assets/Vote.svg";
import Results from "../assets/Results.svg";
import Anonymous from "../assets/Anonymous.svg";
import UserFriendly from "../assets/UserFriendly.svg";
import EndtoEnd from "../assets/EndtoEnd.svg";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="bg-gray-100 text-gray-800">
      <Navbar />

      <section className="bg-[#F4F3F2] py-24 px-4">
        <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center gap-10">
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Vote Privately, Securely & Verifiably
            </h2>
            <p className="text-gray-600 mb-6">
              A secure blockchain-based voting system for modern digital
              democracy.
            </p>
            <Link
              to="/register"
              className="inline-block bg-teal-600 text-white px-6 py-3 rounded hover:bg-teal-700"
            >
              Get Started
            </Link>
          </div>
          <div className="md:w-1/2">
            <img src={HeroImg} alt="Hero" className="w-full max-w-md mx-auto" />
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-100 px-4">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Why Choose DeVote?
          </h2>
          <p className="text-gray-600">
            Transparent, secure, and accessible digital voting for everyone.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <img src={Secure} alt="Secure" className="w-24 h-28 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure</h3>
            <p className="text-gray-600">
              Your vote is encrypted and tamper-proof.
            </p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <img src={Fast} alt="Fast" className="w-24 h-28 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Fast</h3>
            <p className="text-gray-600">
              Blockchain ensure instant vote confirmation
            </p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <img
              src={Transparent}
              alt="Transparent"
              className="w-24 h-28 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">Transparent</h3>
            <p className="text-gray-600">
              Results are traceable and publicly verifiable
            </p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <img
              src={Anonymous}
              alt="Anonymous"
              className="w-24 h-28 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">Anonymous</h3>
            <p className="text-gray-600">Vote without identity exposure</p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <img
              src={UserFriendly}
              alt="UserFriendly"
              className="w-24 h-28 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">User-Friendly</h3>
            <p className="text-gray-600">Easy-to- use interface</p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <img
              src={EndtoEnd}
              alt="End-to-End Encrypted"
              className="w-24 h-28 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">End-to-End Encrypted</h3>
            <p className="text-gray-600">
              No data leak possible, your vote is private and secure.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-100 px-4">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            How it Works?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <img
              src={Register}
              alt="Register"
              className="w-24 h-28 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">Register</h3>
            <p className="text-gray-600">Signup and verify to vote</p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <img src={Vote} alt="Vote" className="w-24 h-28 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Fast</h3>
            <p className="text-gray-600">
              Select your candidate and cast your vote
            </p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <img
              src={Results}
              alt="Results"
              className="w-24 h-28 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">View Results</h3>
            <p className="text-gray-600">
              Access and verify the results on Blockchain
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
