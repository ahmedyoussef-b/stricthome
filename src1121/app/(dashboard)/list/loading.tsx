// src/app/(dashboard)/list/loading.tsx
const Loading = () => {
  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div id="page">
        <div id="container">
            <div id="ring"></div>
            <div id="ring"></div>
            <div id="ring"></div>
            <div id="ring"></div>
            <div id="h3">loading</div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
