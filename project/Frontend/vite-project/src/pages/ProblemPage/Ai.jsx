// import { useForm } from "react-hook-form";
// import axiosClient from "../../../utils/axiosClient";
// import { useEffect, useRef, useState } from "react";

// const Ai = function ({ pid }) {
//   const messagesEndRef = useRef(null);
//   const [history, setHistory] = useState([]);
//   const { register, handleSubmit, reset } = useForm();

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [history]);

//   const onSubmit = async (data) => {
//     reset();

//     const userMessage = {
//       role: "user",
//       parts: [{ text: data.message }],
//     };

//     const newHistory = [...history, userMessage];
//     setHistory(newHistory);

//     const obj = {
//       history: newHistory,
//       message: data.message,
//     };

//     try {
//       const response = await axiosClient.post("ai/solveDoubt", obj);
//       const modelText =
//         response?.data?.reply?.candidates?.[0]?.content?.parts?.[0]?.text;

//       if (modelText) {
//         const modelReply = {
//           role: "model",
//           parts: [{ text: modelText }],
//         };
//         setHistory((prev) => [...prev, modelReply]);
//       }
//     } catch (error) {
//       console.error("Error talking to AI:", error);
//     }
//   };

//   return (
//     <div className="flex flex-col h-[77vh] bg-gray-950 text-white">
//       {/* Chat messages area */}
//       <div className="flex-1 overflow-y-auto px-4 py-3">
//         {history.map((obj, index) =>
//           obj.role === "user" ? (
//             <div key={index} className="chat chat-end">
//               <div className="chat-image avatar">
//                 <div className="w-10 rounded-full">
//                   <img
//                     alt="AI avatar"
//                     src="https://img.daisyui.com/images/profile/demo/anakeen@192.webp"
//                   />
//                 </div>
//               </div>
//               <div className="chat-header">
//                 Anakin
//                 <time className="text-xs opacity-50 ml-2">12:46</time>
//               </div>
//               <div className="chat-bubble">{obj.parts?.[0]?.text}</div>
//               <div className="chat-footer opacity-50">Seen at 12:46</div>
//             </div>
//           ) : (
//             <div key={index} className="chat chat-start">
//               <div className="chat-image avatar">
//                 <div className="w-10 rounded-full">
//                   <img
//                     alt="User avatar"
//                     src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
//                   />
//                 </div>
//               </div>
//               <div className="chat-header">
//                 Obi-Wan Kenobi
//                 <time className="text-xs opacity-50 ml-2">12:45</time>
//               </div>
//               <div className="chat-bubble">{obj.parts?.[0]?.text}</div>
//               <div className="chat-footer opacity-50">Delivered</div>
//             </div>
//           )
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Chat input */}
//       <form
//         onSubmit={handleSubmit(onSubmit)}
//         className="w-full p-3 bg-gray-900 flex gap-2 items-center"
//       >
//         <input
//           id="message"
//           className="flex-grow bg-black text-white p-2 rounded"
//           placeholder="Type your message..."
//           {...register("message", {
//             required: "This is required",
//             maxLength: { value: 100, message: "Max 100 chars" },
//           })}
//         />
//         <button
//           type="submit"
//           className="bg-blue-600 px-4 py-2 text-white rounded"
//         >
//           Send
//         </button>
//       </form>
//     </div>
//   );
// };

// export default Ai;


import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { adduserMessage, Aisolve, clearHistory} from "../../../utils/Slice/chatSlice";
import solveDoubtSlice from "../../../utils/Slice/chatSlice";
import { Send } from 'lucide-react';
import axiosClient from "../../../utils/axiosClient";

const Ai = function ({ pid }) {


  const convert = (id) => {
    const timestamp = Number(id); // Convert string to number
    if (isNaN(timestamp)) {
      return "Invalid Time";
    }
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "Invalid Time";
    }
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const dispatch = useDispatch();
  const {history,loading}=useSelector((state)=>state.solveDoubt);
  const messagesEndRef = useRef(null);
  const { register, handleSubmit, reset } = useForm();
  const {user}=useSelector((state)=>state.auth);
  const [problemtitle,setproblemTitle]=useState("");
  const [problemDiscription,setproblemDis]=useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
   useEffect(() => {
  const fetchProblem = async () => {
    try {
      const response = await axiosClient.get(`/problem/problemById/${pid}`);
      // console.log(response.data);
      setproblemTitle(response.data.Title);
      setproblemDis(response.data.Description);
    } catch (error) {
      console.error("Failed to fetch problem", error);
    }
  };

  fetchProblem();
}, [pid]);

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const onSubmit = async (data) => {
    reset();
    await dispatch(adduserMessage({message:data.message}))
    const obj = {
      history,
      message: data.message,
      Title: problemtitle,
      Discription:problemDiscription
    };

      try {
        await dispatch(Aisolve(obj)).unwrap();
      } catch (err) {
  
      }
      // console.log(history);
  };

  return (
    <div className="flex flex-col h-[78vh] ">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {history.map((obj, index) =>
          obj.role === "user" ? (
            <div key={index} className="chat chat-end">
              <div className="chat-header">
                {user.First_Name}
                <time className="text-xs opacity-50 ml-2">{convert(obj.id)}</time>
              </div>
              <div className="chat-bubble">{obj.parts?.[0]?.text}</div>
            </div>
          ) : obj.role==='model' ? (
            <div key={index} className="chat chat-start">
              
              <div className="chat-header">
                DebugBuddy
                <time className="text-xs opacity-50 ml-2">{convert(obj.id)}</time>
              </div>
              <div className="chat-bubble">{obj.parts?.[0]?.text}</div>
            </div>
          ) : (
            <div key={index} className="chat chat-start">
              
              <div className="chat-header">
                DebugBuddy
                <time className="text-xs opacity-50 ml-2">{convert(obj.id)}</time>
              </div>
              <div className="chat-bubble"><span className="loading loading-dots loading-xl"></span></div>
            </div>
        )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full p-3 bg-gray-500 flex gap-2 items-center rounded-3xl"
      >
        <input
          id="message"
          className="flex-grow  text-white p-2 focus:outline-none"
          placeholder="Type your message..."
          {...register("message", {
            required: "This is required",
            maxLength: { value: 100, message: "Max 100 chars" },
          })}
        />
        <button 
          type="submit"
          className=" px-4 py-2 text-white rounded"
        >
          <Send />
        </button>
      </form>
    </div>
  );
};

export default Ai;