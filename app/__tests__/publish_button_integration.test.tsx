import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PublishToggle from "../lib/components/noteElements/publish_toggle";

describe("PublishToggle Integration Test", () => {
  it.skip("toggles publish state when clicked", async () => {
    let isPublished = false;
    const onPublishClickMock = jest.fn(() => {
      isPublished = !isPublished;
    });

    render(<PublishToggle isPublished={isPublished} onPublishClick={onPublishClickMock} />);

    const publishToggle = screen.getByText(/Publish/i);
    expect(publishToggle).toBeInTheDocument();
    expect(publishToggle).toHaveClass("text-black");

    fireEvent.click(publishToggle);
    expect(onPublishClickMock).toHaveBeenCalledTimes(1);
  });

  it.skip("shows and hides the publish notification correctly", async () => {
    render(<PublishToggle isPublished={false} />);
    const publishToggle = screen.getByText(/Publish/i);

    fireEvent.click(publishToggle);

    const notification = await screen.findByText(/Note published successfully!/i);
    expect(notification).toBeInTheDocument();

    await waitFor(() => {
      expect(notification).not.toBeInTheDocument();
    }, { timeout: 3500 });
  });

  it.skip("renders the publish button with correct styles when toggled", () => {
    const { rerender } = render(<PublishToggle isPublished={false} />);
    const publishText = screen.getByText(/Publish/i);

    expect(publishText).toHaveClass("text-black");

    rerender(<PublishToggle isPublished={true} />);
    expect(publishText).toHaveClass("text-blue-500");
  });

  it.skip("does not crash when onPublishClick is not provided", () => {
    render(<PublishToggle isPublished={false} />);
    const publishText = screen.getByText(/Publish/i);

    expect(publishText).toBeInTheDocument();
    fireEvent.click(publishText);
  });
});
