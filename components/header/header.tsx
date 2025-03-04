import { Icons } from "@/components/icons";

const Header = () => {
  return (
    <div className="flex justify-between items-center rounded">
      <div className="flex items-center gap-2">
        <span className=" bg-[#D0DECF] p-2">
          <Icons.Location className="w-5 h-5 text-green-600" />
        </span>
        <div>
          <p className="text-sm text-gray-500">Home</p>
          <p className="text-sm font-semibold">Jl. Soekarno Hatta 15A Malang</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Icons.Language className="w-6 h-6 text-gray-500" />
        <Icons.BellIcon className="w-5 h-5 text-green-600" />
      </div>
    </div>
  );
};

export default Header;
