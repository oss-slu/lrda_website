import React from 'react';

export const Panel = ({ children, defaultSize, minSize, maxSize, ...props }: any) => <div {...props}>{children}</div>;
export const PanelGroup = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const PanelResizeHandle = ({ ...props }: any) => <div {...props} />;
