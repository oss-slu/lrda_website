import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PublishToggle from "../lib/components/noteElements/publish_toggle";

describe("PublishToggle Component", () => {
  it("renders the publish button with correct initial state", () => {
    render(<PublishToggle isPublished={false} onPublishClick={jest.fn()} />);
    const publishButton = screen.getByText(/Publish/i);
    expect(publishButton).toBeInTheDocument();
    expect(publishButton).toHaveClass("text-black");
  });

  it("renders as published when isPublished is true", () => {
    render(<PublishToggle isPublished={true} onPublishClick={jest.fn()} />);
    const publishButton = screen.getByText(/Unpublish/i);
    expect(publishButton).toBeInTheDocument();
    expect(publishButton).toHaveClass("text-green-500");
  });

  it("calls onPublishClick when clicked", async () => {
    const onPublishClickMock = jest.fn().mockResolvedValue(undefined);
    render(<PublishToggle isPublished={false} onPublishClick={onPublishClickMock} />);
    const button = screen.getByText(/Publish/i);
    fireEvent.click(button);
    await waitFor(() => expect(onPublishClickMock).toHaveBeenCalledTimes(1));
  });

  it("displays publish notification on click and hides after timeout", async () => {
    let isPublished = false;
    const onPublishClickMock = jest.fn(async () => {
      isPublished = !isPublished;
    });
  
    const { rerender } = render(
      <PublishToggle isPublished={isPublished} onPublishClick={onPublishClickMock} />
    );
  
    const button = screen.getByText(/Publish/i);
    fireEvent.click(button);
  
    // Simulate prop change after async action
    await waitFor(() => expect(onPublishClickMock).toHaveBeenCalled());
  
    // Re-render with new publish state
    rerender(<PublishToggle isPublished={true} onPublishClick={onPublishClickMock} />);
  
    const notification = await screen.findByText(/Note published successfully!/i);
    expect(notification).toBeInTheDocument();
  
    await waitFor(
      () => {
        expect(screen.queryByText(/Note published successfully!/i)).not.toBeInTheDocument();
      },
      { timeout: 3500 }
    );
  });  

  it("updates correctly when isPublished prop changes", () => {
    const { rerender } = render(<PublishToggle isPublished={false} onPublishClick={jest.fn()} />);
    const button = screen.getByText(/Publish/i);
    expect(button).toHaveClass("text-black");

    rerender(<PublishToggle isPublished={true} onPublishClick={jest.fn()} />);
    const updatedButton = screen.getByText(/Unpublish/i);
    expect(updatedButton).toHaveClass("text-green-500");
  });
});
