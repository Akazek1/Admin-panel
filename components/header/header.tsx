import { Icons } from "@/components/icons";
import { RootState } from "@/store";
import { User } from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";

const Header = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  return (
    <div className="flex justify-between items-center rounded">
      {
        user?.userType === "Individual" ? <Link href={"/profile"} className="p-2 cursor-pointer rounded-full bg-[#167021] text-white"><User className="w-5 h-5" /></Link> :
          <>
            <div className="flex items-center gap-2">
              <span className=" bg-[#D0DECF] p-2">
                <Icons.Location className="w-5 h-5 text-green-600" />
              </span>
              <div>
                <p className="text-sm text-gray-500">Home</p>
                <p className="text-sm font-semibold">Jl. Soekarno Hatta 15A Malang</p>
              </div>
            </div>
          </>
      }
      <div className="flex items-center gap-6">
        <Icons.Language className="w-6 h-6 text-gray-500" />
        <span className="relative">
          <Icons.BellIcon className="w-5 h-5 text-green-600 z-0" />
          <span className="bg-red-700 rounded-full w-1.5 h-1.5 absolute -top-0.5 right-1 z-10" />
        </span>
      </div>
    </div>
  );
};

export default Header;
