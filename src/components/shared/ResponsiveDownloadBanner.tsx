import React from 'react';

interface ResponsiveDownloadBannerProps {
  className?: string;
  rounded?: boolean;
}

const ResponsiveDownloadBanner: React.FC<ResponsiveDownloadBannerProps> = ({
  className = '',
  rounded = true,
}) => {
  return (
    <a
      href="/download"
      className={`group block w-full overflow-hidden ${rounded ? 'rounded-[1.5rem] md:rounded-[2rem]' : ''} ${className}`}
      aria-label="Download the Juno app"
    >
      <picture>
        <source media="(max-width: 767px)" srcSet="/images/misc/portrait_banner.png" />
        <img
          src="/images/misc/landscape_banner.png"
          alt="Download the Juno app"
          className={`block w-full bg-[#090909] transition-transform duration-500 group-hover:scale-[1.01] ${
            rounded ? 'rounded-[1.5rem] md:rounded-[2rem]' : ''
          } aspect-[4/5] object-cover md:aspect-[12/5]`}
          loading="lazy"
          decoding="async"
        />
      </picture>
    </a>
  );
};

export default ResponsiveDownloadBanner;
