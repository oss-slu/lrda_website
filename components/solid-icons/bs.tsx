import React from 'react';

type IconProps = {
  className?: string;
  size?: number | string;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
};

export const BsImage: React.FC<IconProps> = ({ className = '', size = 48, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    {...rest}
  >
    <path d="M14 2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1z" fill="#E6EEF8" />
    <path d="M4.5 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#94A3B8" />
    <path d="M2 12.5l3.5-4 4.5 3 3-4L14 12H2z" fill="#B6C2D1" />
  </svg>
);

export default BsImage;
