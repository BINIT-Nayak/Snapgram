const Loader = () => (
  <div className="flex-center w-full">
    <div className="rounded-full bg-dark-3 p-3 shadow-lg shadow-black">
      <img
        src="/assets/icons/loader.svg"
        alt="loader"
        width={24}
        height={24}
        className="animate-spin"
      />
    </div>
  </div>
);

export default Loader;
