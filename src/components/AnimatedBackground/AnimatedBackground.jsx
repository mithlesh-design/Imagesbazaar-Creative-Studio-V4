import React from 'react';
import './AnimatedBackground.css';

const DEFAULT_BG_IMAGE =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260626_041422_4a459e05-abce-4150-9fb7-4ededc423cd1.png&w=1280&q=85';

/**
 * Reusable Animated Background Component
 *
 * @param {Object} props
 * @param {string} [props.imageUrl] - Background image URL (defaults to Alwayzz background image)
 * @param {boolean} [props.showImage=true] - Toggle background image visibility
 * @param {boolean} [props.showLines=true] - Toggle curved line pulse animations
 * @param {string} [props.lineColor='#FCFAF8'] - Border color of curved lines
 * @param {number} [props.lineBorderWidth=2.5] - Border width in pixels
 * @param {number} [props.lineCount=20] - Number of animated lines on each side
 * @param {number} [props.animationDuration=5] - Animation cycle duration in seconds
 * @param {number} [props.staggerDelay=0.25] - Stagger delay per line in seconds
 * @param {string} [props.backgroundColor='#ffffff'] - Base background color
 * @param {string} [props.overlayColor] - Optional overlay color (e.g. 'rgba(0,0,0,0.1)')
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {Object} [props.style={}] - Inline styles for container
 * @param {React.ReactNode} [props.children] - Optional nested content/children
 */
export default function AnimatedBackground({
  imageUrl = DEFAULT_BG_IMAGE,
  showImage = true,
  showLines = true,
  lineColor = '#FCFAF8',
  lineBorderWidth = 2.5,
  lineCount = 20,
  animationDuration = 5,
  staggerDelay = 0.25,
  backgroundColor = '#ffffff',
  overlayColor,
  className = '',
  style = {},
  children,
}) {
  const lines = Array.from({ length: lineCount }, (_, i) => i);
  const borderStyle = `${lineBorderWidth}px solid ${lineColor}`;

  return (
    <div
      className={`alwayzz-bg-root ${className}`}
      style={{
        '--alwayzz-bg': backgroundColor,
        ...style,
      }}
    >
      {/* Background Image */}
      {showImage && imageUrl && (
        <div
          className="alwayzz-bg-image"
          style={{ backgroundImage: `url("${imageUrl}")` }}
          aria-hidden="true"
        />
      )}

      {/* Optional Color Tint Overlay */}
      {overlayColor && (
        <div
          className="alwayzz-bg-overlay"
          style={{ backgroundColor: overlayColor }}
          aria-hidden="true"
        />
      )}

      {/* Curved Lines Animation */}
      {showLines && (
        <div className="alwayzz-lines-container" aria-hidden="true">
          {/* Desktop Left Lines */}
          <div className="alwayzz-lines-side alwayzz-lines-left">
            {lines.map((i) => {
              const width = 60 + i * 10;
              const delay = `${(i * staggerDelay).toFixed(2)}s`;
              return (
                <div
                  key={`left-${i}`}
                  className="alwayzz-curved-line"
                  style={{
                    width: `${width}px`,
                    border: borderStyle,
                    animationDuration: `${animationDuration}s`,
                    animationDelay: delay,
                  }}
                />
              );
            })}
          </div>

          {/* Desktop Right Lines */}
          <div className="alwayzz-lines-side alwayzz-lines-right">
            {lines.map((i) => {
              const width = 60 + i * 10;
              const delay = `${(i * staggerDelay).toFixed(2)}s`;
              return (
                <div
                  key={`right-${i}`}
                  className="alwayzz-curved-line"
                  style={{
                    width: `${width}px`,
                    border: borderStyle,
                    animationDuration: `${animationDuration}s`,
                    animationDelay: delay,
                  }}
                />
              );
            })}
          </div>

          {/* Mobile Top Horizontal Lines (<810px) */}
          <div className="alwayzz-lines-top-mobile">
            {lines.map((i) => {
              const height = 30 + i * 8;
              const widthPercent = Math.min(100, 40 + i * 3);
              const delay = `${(i * staggerDelay).toFixed(2)}s`;
              return (
                <div
                  key={`top-${i}`}
                  className="alwayzz-curved-line-top"
                  style={{
                    height: `${height}px`,
                    width: `${widthPercent}%`,
                    border: borderStyle,
                    animationDuration: `${animationDuration}s`,
                    animationDelay: delay,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Optional Children Content */}
      {children && <div className="alwayzz-bg-content">{children}</div>}
    </div>
  );
}
