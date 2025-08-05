import { useState, useEffect } from "react";
import api from "../api";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    profile_picture: null,
  });

  const fetchProfile = async () => {
    const res = await api.get("/accounts/me/");
    setProfile(res.data);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setProfile({
      ...profile,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", profile.name);
    formData.append("bio", profile.bio);
    if (profile.profile_picture) {
      formData.append("profile_picture", profile.profile_picture);
    }

    await api.put("/accounts/me/update/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    alert("Profile updated!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={profile.name} onChange={handleChange} />
      <textarea name="bio" value={profile.bio} onChange={handleChange} />
      <input type="file" name="profile_picture" onChange={handleChange} />
      <button type="submit">Update</button>
    </form>
  );
}
