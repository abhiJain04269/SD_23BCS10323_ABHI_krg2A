import { NavLink } from "react-router";
import { PlusCircle, Edit3, Trash2 } from "lucide-react";

const AdminPannel = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-[#f7f8fa]">
      <div className="bg-white shadow-md rounded-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">Admin Panel</h1>
        <div className="space-y-4">
          <NavLink to="/adminPannel/create" className="block">
            <div className="flex items-center gap-3 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
              <PlusCircle className="text-blue-600" />
              <span className="text-gray-800 font-medium">Create Problem</span>
            </div>
          </NavLink>

          <NavLink to="/adminPannel/update" className="block">
            <div className="flex items-center gap-3 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
              <Edit3 className="text-green-600" />
              <span className="text-gray-800 font-medium">Update Problem</span>
            </div>
          </NavLink>

          <NavLink to="/adminPannel/delete" className="block">
            <div className="flex items-center gap-3 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
              <Trash2 className="text-red-600" />
              <span className="text-gray-800 font-medium">Delete Problem</span>
            </div>
          </NavLink>

          <NavLink to="/adminPannel/video" className="block">
            <div className="flex items-center gap-3 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
              <Trash2 className="text-red-600" />
              <span className="text-gray-800 font-medium">Upload Video</span>
            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default AdminPannel;