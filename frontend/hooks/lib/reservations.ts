// Define the Reservation type if not imported from elsewhere
type Reservation = {
  // Add appropriate fields, for example:
  id: string;
  name: string;
  date: string;
  // Add more fields as needed
};

export const createReservation = async (reservation: Reservation): Promise<boolean> => {
  try {
    const existing = JSON.parse(localStorage.getItem("reservations") || "[]")
    existing.push(reservation)
    localStorage.setItem("reservations", JSON.stringify(existing))
    return true
  } catch (error) {
    console.error("Error al guardar la reserva:", error)
    return false
  }
}

// Simple apiClient implementation using fetch
const apiClient = {
  get: async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  }
};

export const getReservations = () => apiClient.get('/reservations') // o '/reservas' si prefieres español