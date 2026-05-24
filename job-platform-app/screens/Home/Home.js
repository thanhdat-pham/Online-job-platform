import { useContext } from "react";
import { MyUserContext } from "../../configs/Contexts";
import CandidateHome from "./CandidateHome";
import EmployerHome from "./EmployerHome";

const Home = () => {
    const [user] = useContext(MyUserContext);

    // Kiểm tra role để trả về component tương ứng trong cùng thư mục
    if (user?.role === 'EMPLOYER') {
        return <EmployerHome />;
    }

    return <CandidateHome />;
};

export default Home;