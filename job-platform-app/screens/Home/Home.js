import { useContext } from "react";
import { MyUserContext } from "../../configs/Contexts";
import CandidateHome from "./CandidateHome";
import EmployerHome from "./EmployerHome";

const Home = () => {
    const [user] = useContext(MyUserContext);


    if (user?.role === 'EMPLOYER') {
        return <EmployerHome />;
    }

    return <CandidateHome />;
};

export default Home;