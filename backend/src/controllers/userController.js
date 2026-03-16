export const authMe = async (req, res) => {
    try {
        const user = req.user; //get from protectedRoute middleware
        return res.status(200).json({ message: "User authenticated successfully", user });
    } catch (error) {
        console.error("Error in authMe:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}