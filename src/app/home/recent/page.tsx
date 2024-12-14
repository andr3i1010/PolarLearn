export default async function Recent() {
  return (
    <>
    <div className="subjects">
      <h1 className="text-4xl pl-5 pt-4 font-extrabold">Recente Vakken:</h1>
      <div className='wrapper'>
        <div className="flex pt-5 pl-5 space-x-4 relative overflow-hidden">
          <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid">TEST 🇩🇪</div>
        </div>
      </div>
    </div>
  </>
  );
}