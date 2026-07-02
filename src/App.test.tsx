import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import App from "./App";

it("supports accessible search, Zero Trust filtering, and mandate details", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { name: "Federal Cyber Mandates Library" }),
  ).toBeInTheDocument();
  await user.type(
    screen.getByRole("searchbox", { name: "Search mandates" }),
    "phishing-resistant",
  );
  expect(screen.getByText("M-22-09")).toBeInTheDocument();
  await user.click(screen.getByRole("checkbox", { name: /Zero Trust only/ }));
  await user.click(
    screen.getByRole("link", { name: /Moving the U.S. Government/ }),
  );
  expect(
    await screen.findByRole("heading", { name: "Key requirements" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/verify requirements against the authoritative source/i),
  ).toBeInTheDocument();
});
