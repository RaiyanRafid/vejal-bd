// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { BarList } from "@/components/charts/BarList";
import { Sparkline } from "@/components/charts/Sparkline";

it("BarList renders suppressed rows as <৩ and scales widths to max", () => {
  render(<BarList rows={[{ label: "ঢাকা", value: 100 }, { label: "সিলেট", value: 50 }, { label: "বান্দরবান", value: null }]} />);
  expect(screen.getByText("<৩")).toBeTruthy();
  expect(screen.getByTestId("bar-সিলেট").style.width).toBe("50%");
});

it("Sparkline renders one polyline with N points", () => {
  const { container } = render(<Sparkline points={[1, 4, 2]} />);
  expect(container.querySelector("polyline")!.getAttribute("points")!.split(" ")).toHaveLength(3);
});
