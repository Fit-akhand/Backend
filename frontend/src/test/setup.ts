import "@testing-library/jest-dom/vitest";
import React from "react";

// Vitest + Vite 8 automatic JSX can omit the React runtime in this setup.
(globalThis as unknown as { React: typeof React }).React = React;

if (typeof HTMLDialogElement !== "undefined") {
  const proto = HTMLDialogElement.prototype;
  if (typeof proto.showModal !== "function") {
    proto.showModal = function showModal() {
      this.setAttribute("open", "");
    };
  }
  if (typeof proto.close !== "function") {
    proto.close = function close() {
      this.removeAttribute("open");
    };
  }
}
