import clsx from "clsx";
import Price from "./price";

const Label = ({
  title,
  amount,
  currencyCode,
  position = "bottom",
}: {
  title: string;
  amount: string;
  currencyCode: string;
  position?: "bottom" | "center";
}) => {
  return (
    <div
      className={clsx(
        "absolute bottom-0 left-0 flex w-full px-3 pb-3 @container/label",
        {
          "lg:px-20 lg:pb-[35%]": position === "center",
        },
      )}
    >
      <div className="flex w-full items-center rounded-md border border-ink-200 bg-white/95 p-1 text-xs font-semibold text-ink-950 shadow-card backdrop-blur-md">
        <h3 className="mr-3 line-clamp-2 grow pl-2 leading-tight font-bold tracking-tight">
          {title}
        </h3>
        <Price
          className="flex-none rounded-sm bg-brand-500 p-2 font-bold text-white"
          amount={amount}
          currencyCode={currencyCode}
          currencyCodeClassName="hidden @[275px]/label:inline"
        />
      </div>
    </div>
  );
};

export default Label;
