import type { ReviewSlot } from "./reviewState";

/**
 * Five independent minds looking at the same problem, each from a different
 * angle, none knowing what the others think. Nodes light up as reviews land.
 */
export function PentagonReviewers({ slots }: { slots: ReviewSlot[] }) {
  const cx = 200;
  const cy = 172;
  const R = 122;
  const nodeR = 30;
  const n = slots.length || 5;

  const point = (i: number) => {
    const a = ((-90 + (360 / n) * i) * Math.PI) / 180;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  };

  return (
    <svg
      viewBox="0 0 400 360"
      className="mx-auto w-full max-w-md"
      role="img"
      aria-label="Five specialists reviewing the case independently"
    >
      {/* Outer guide ring */}
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="#212A36"
        strokeWidth={1}
        strokeDasharray="2 6"
        opacity={0.7}
      />

      {/* Spokes from the case to each reviewer */}
      {slots.map((slot, i) => {
        const p = point(i);
        const active = slot.status === "complete";
        const reviewing = slot.status === "reviewing";
        return (
          <line
            key={`line-${slot.meta.id}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke={active ? slot.meta.hue : reviewing ? "#3D82F7" : "#212A36"}
            strokeWidth={active ? 2 : 1.25}
            opacity={active ? 0.7 : reviewing ? 0.6 : 0.5}
            className={reviewing ? "animate-pulse-soft" : undefined}
          />
        );
      })}

      {/* Central case node */}
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={34}
          fill="#12161D"
          stroke="#3D82F7"
          strokeWidth={1.5}
          className="animate-pulse-soft"
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#6BA1FF"
          fontSize="10"
          fontWeight={700}
          letterSpacing="1.5"
        >
          CASE
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#5E6672"
          fontSize="7.5"
          letterSpacing="0.5"
        >
          anonymised
        </text>
      </g>

      {/* Reviewer nodes */}
      {slots.map((slot, i) => {
        const p = point(i);
        const { status, meta } = slot;
        const complete = status === "complete";
        const reviewing = status === "reviewing";
        const error = status === "error";
        const stroke = error ? "#F04438" : meta.hue;
        const opacity = complete || reviewing ? 1 : 0.4;
        return (
          <g
            key={`node-${meta.id}`}
            opacity={opacity}
            className={reviewing ? "animate-pulse-soft" : undefined}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={nodeR}
              fill={complete ? `${meta.hue}1f` : "#12161D"}
              stroke={stroke}
              strokeWidth={complete ? 2.5 : 1.75}
              strokeDasharray={error ? "3 3" : undefined}
            />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={complete || reviewing ? stroke : "#98A2B3"}
              fontSize="13"
              fontWeight={700}
            >
              {meta.initials}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
