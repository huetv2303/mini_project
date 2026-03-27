import React from "react";
import CustomerNavbar from "./CustomerNavbar";
import CustomerFooter from "./CustomerFooter";

const CustomerLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <CustomerNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <CustomerFooter />
    </div>
  );
};

export default CustomerLayout;
