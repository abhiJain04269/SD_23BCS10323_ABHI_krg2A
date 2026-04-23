import { Routes,Route,Navigate,BrowserRouter } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "../utils/Slice/authSlice";
import AdminPannelCreate from "./pages/AdminPannel/AdminPannelCreate";
import AdminPannel from "./pages/AdminPannel/AdminPannel";
import AdminPannelUpdate from "./pages/AdminPannel/AdminPannelUpdate";
import AdminPannelDelete from "./pages/AdminPannel/AdminPannelDelete";
import ProblemPage from "./pages/ProblemPage/ProblemPage";
import AdminPannelVideo from "../src/pages/AdminPannel/AdminPannelVideo";
import AdminUpload from "../src/pages/AdminPannel/AdminUpload";
import UpdatePage from "./pages/AdminPannel/updatePage";
import Profile from "./pages/profile";
import EditProfile from "./pages/EditProfile";
import OTPpage from "./pages/EnterOtpPage";
import ForgotPass from "./pages/ForgotPass";
import ResetPass from "./pages/RestPassPage";
import LandingPage from "./pages/LandingPage";
import Logout from "./pages/logout";

function App(){
  const dispatch = useDispatch();
// const {user,isAuthenticated} = useSelector((state)=>state.auth);
const {isAuthenticated,user,loading} = useSelector((state)=>state.auth);

  useEffect(()=>{
    dispatch(checkAuth());
  },[dispatch])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  }

  return(

    <>
      <Routes>
        <Route path="/logout" element={<Logout />} />
        <Route path="/" element={isAuthenticated?<Navigate to ="/home"/>:<LandingPage></LandingPage>}></Route>
        <Route path="/home" element={isAuthenticated?<Home></Home>:<Navigate to="/login"/>}></Route>
        <Route path="/login" element={isAuthenticated?<Navigate to="/home" />:<Login></Login>}></Route>
        <Route path="/signup" element={isAuthenticated?<Navigate to="/home"/>:<Signup></Signup>}></Route>
        <Route path="/otp" element={<OTPpage />} />
        <Route path="/reset-password" element={<ResetPass></ResetPass>} />
        <Route path="/forgot-password" element={<ForgotPass></ForgotPass>} />
        <Route path="/profile/:user_id" element={isAuthenticated?<Profile></Profile>:<Navigate to="/signup"/>}></Route>
        <Route path="/editprofile/:user_id" element={isAuthenticated?<EditProfile></EditProfile>:<Navigate to="/signup"/>}></Route>
        <Route path="/adminPannel/create" element={isAuthenticated && user?.Role==="admin" ?<AdminPannelCreate/>:<Navigate to="/signup"/>}></Route>
        <Route path="/adminPannel/update" element={isAuthenticated && user?.Role==="admin" ?<AdminPannelUpdate/>:<Navigate to="/signup"/>}></Route>
        <Route path="/adminPannel/update/:problemid" element={isAuthenticated && user?.Role==="admin" ?<UpdatePage/>:<Navigate to="/signup"/>}></Route>
        <Route path="/adminPannel/delete" element={isAuthenticated && user?.Role==="admin" ?<AdminPannelDelete/>:<Navigate to="/signup"/>}></Route>
        <Route path="/adminPannel" element={isAuthenticated && user.Role=="admin" ?<AdminPannel/>:<Navigate to="/signup"/>}></Route>
        <Route path="/adminPannel/video" element={isAuthenticated && user?.Role === 'admin' ? <AdminPannelVideo /> : <Navigate to="/home" />} />
        <Route path="/admin/upload/:problemId" element={isAuthenticated && user?.Role === 'admin' ? <AdminUpload /> : <Navigate to="/home" />} />
        <Route path="/problemById/:id" element={isAuthenticated?<ProblemPage/>:<Navigate to="/Signup"/>}></Route>
      </Routes>
    </>

  )
}
export default App; 