import axios from 'axios';

const getRandomUser = async () => {
    try {
        let { data } = await axios.get("https://randomuser.me/api/");

        let randomUser = data.results[0];
        return randomUser;
    } catch (error) {
        console.log(error);
    }
}

export default getRandomUser;