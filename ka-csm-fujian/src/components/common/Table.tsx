export function Table({
  children,
  onScroll,
  scrollRef,
}: {
  children: React.ReactNode;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  scrollRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div ref={scrollRef} className="table-wrap" onScroll={onScroll}>
      <table>{children}</table>
    </div>
  );
}
