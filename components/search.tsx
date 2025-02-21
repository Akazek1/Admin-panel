import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";

const SearchBar = () => {
  return (
    <div className="">
      <div className="relative">
        <Icons.SearchIcon className="absolute left-3 top-3 w-4 h-4 fill-[#878787]" />
        <Input
          type="text"
          placeholder="Search baby sitter, carpenter etc"
          className="pl-10 border-[#D6D6D6] rounded-[40px]"
        />
        <Icons.FilerIcon className="absolute right-4 top-3 w-[18px] h-[18px] fill-[#145B10]" />
      </div>
    </div>
  );
};

export default SearchBar;
