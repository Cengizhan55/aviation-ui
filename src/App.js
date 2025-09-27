import React, { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  Box,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";

function App() {
  const [tab, setTab] = useState(0); // Aktif sekme (0=Route Finder, 1=Locations, 2=Transportations)

  // --- COMMON STATE ---
  const [locations, setLocations] = useState([]); // Tüm lokasyonlar
  const [loadingLocations, setLoadingLocations] = useState(false); // Lokasyon yükleniyor mu
  const [error, setError] = useState(""); // Hata mesajları

  // --- ROUTE FINDER STATE ---
  const [origin, setOrigin] = useState(""); // Seçilen başlangıç noktası
  const [destination, setDestination] = useState(""); // Seçilen hedef
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Seçilen tarih
  const [routes, setRoutes] = useState([]); // Bulunan rotalar
  const [loadingRoutes, setLoadingRoutes] = useState(false); // Rotalar yükleniyor mu

  // --- LOCATION CRUD STATE ---
  const [openLocationDialog, setOpenLocationDialog] = useState(false); // Lokasyon ekleme/edit dialogu açık mı
  const [editLocation, setEditLocation] = useState(null); // Düzenlenen veya yeni eklenen lokasyon

  // --- TRANSPORTATION CRUD STATE ---
  const [openTransportationDialog, setOpenTransportationDialog] = useState(false); // Transportation dialog açık mı
  const [editTransportation, setEditTransportation] = useState({
    originCode: "",
    destinationCode: "",
    transportationType: "",
    operatingDays: [],
  }); // Düzenlenen veya yeni eklenen transportation
  const [transportations, setTransportations] = useState([]); // Tüm transportationlar
  const [loadingTransportations, setLoadingTransportations] = useState(false); // Loading state

  // --- FETCH DATA FUNCTIONS ---
  const fetchLocations = async () => {
    setLoadingLocations(true); // Yükleme başlat
    try {
      const res = await fetch("http://localhost:8090/api/v1/location");
      if (!res.ok) throw new Error("Failed to fetch locations");
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingLocations(false); // Yükleme bitti
    }
  };

  const fetchTransportations = async () => {
    setLoadingTransportations(true); // Yükleme başlat
    try {
      const res = await fetch("http://localhost:8090/api/v1/transportation");
      if (!res.ok) throw new Error("Failed to fetch transportations");
      const data = await res.json();
      setTransportations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTransportations(false); // Yükleme bitti
    }
  };

  useEffect(() => {
    fetchLocations(); // Sayfa açılır açılmaz lokasyonları yükle
    fetchTransportations(); // Transportationları yükle
  }, []);

  // --- ROUTE FINDER FUNCTION ---
  const handleSearch = async () => {
    if (!origin || !destination) {
      setError("Origin ve Destination seçmelisiniz");
      return;
    }
    setError(""); // Önceki hatayı temizle
    setLoadingRoutes(true);

    try {
      const response = await fetch("http://localhost:8090/api/v1/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originId: origin, destinationId: destination, date }),
      });

      if (!response.ok) throw new Error("Route fetch error");
      const data = await response.json();
      setRoutes(data); // Rotaları kaydet
    } catch (err) {
      setError(err.message);
      setRoutes([]); // Hata varsa rotaları temizle
    } finally {
      setLoadingRoutes(false);
    }
  };

  // --- LOCATION CRUD FUNCTIONS ---
  const handleDeleteLocation = async (id) => {
    try {
      await fetch(`http://localhost:8090/api/v1/location/${id}`, { method: "DELETE" });
      fetchLocations(); // Silindikten sonra lokasyonları yeniden yükle
      await fetchTransportations(); // Silme sonrası transportations da yenilenmeli
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveLocation = async () => {
    try {
      const method = editLocation.id ? "PUT" : "POST"; // ID varsa update, yoksa create
      const url = editLocation.id
        ? `http://localhost:8090/api/v1/location/${editLocation.id}`
        : "http://localhost:8090/api/v1/location";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editLocation),
      });

      setOpenLocationDialog(false); // Dialogu kapat
      setEditLocation(null); // Edit state sıfırla
      fetchLocations(); // Lokasyonları yeniden yükle
    } catch (err) {
      setError(err.message);
    }
  };

  // --- TRANSPORTATION CRUD FUNCTIONS ---
  const handleDeleteTransportation = async (id) => {
    try {
      await fetch(`http://localhost:8090/api/v1/transportation/${id}`, { method: "DELETE" });
      fetchTransportations(); // Silme sonrası listeyi yenile
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveTransportation = async () => {
    try {
      if (!editTransportation.originCode || !editTransportation.destinationCode) {
        setError("Origin ve Destination seçmelisiniz");
        return;
      }

      const method = editTransportation.id ? "PUT" : "POST"; // ID varsa update, yoksa create
      const url = editTransportation.id
        ? `http://localhost:8090/api/v1/transportation/${editTransportation.id}`
        : "http://localhost:8090/api/v1/transportation";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTransportation),
      });

      // Dialogu kapat ve edit state sıfırla
      setOpenTransportationDialog(false);
      setEditTransportation({ originCode: "", destinationCode: "", transportationType: "", operatingDays: [] });
      fetchTransportations(); // Listeyi yenile
    } catch (err) {
      setError(err.message);
    }
  };

  // --- RENDER ---
  return (
    <Box sx={{ width: "95%", margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <Typography variant="h4" gutterBottom sx={{ color: "#E30613", fontWeight: "bold", mt: 2 }}>
        Aviation Route Finder
      </Typography>

      {/* Sekmeler */}
      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Route Finder" />
        <Tab label="Locations" />
        <Tab label="Transportations" />
      </Tabs>

      {/* --- ROUTE FINDER TAB --- */}
      {tab === 0 && (
        <Box>
          {loadingLocations ? (
            <Typography>Loading locations...</Typography>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
              {/* Origin ve Destination seçimleri */}
              <Select value={origin} onChange={(e) => setOrigin(e.target.value)} displayEmpty sx={{ minWidth: 180 }}>
                <MenuItem value="">Select Origin</MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>{loc.name} ({loc.city})</MenuItem>
                ))}
              </Select>

              <Select value={destination} onChange={(e) => setDestination(e.target.value)} displayEmpty sx={{ minWidth: 180 }}>
                <MenuItem value="">Select Destination</MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>{loc.name} ({loc.city})</MenuItem>
                ))}
              </Select>

              {/* Tarih seçimi */}
              <TextField type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Button variant="contained" sx={{ backgroundColor: "#E30613", color: "#fff" }} onClick={handleSearch}>Search</Button>
            </Box>
          )}

          {error && <Typography color="error">{error}</Typography>}
          {loadingRoutes && <Typography>Loading routes...</Typography>}
          {!loadingRoutes && routes.length === 0 && !error && <Typography>No routes found</Typography>}

          {/* Rotaların gösterimi */}
          {routes.map((routePath, idx) => (
            <Card key={idx} sx={{ mb: 1, border: "2px solid #E30613", borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: "#E30613", fontWeight: "bold" }}>
                  Route Option {idx + 1}
                </Typography>
                <Typography sx={{ color: "#333" }}>
                  {routePath.map((step, i) => {
                    const origin = locations.find((loc) => loc.locationCode === step.originCode);
                    const destination = locations.find((loc) => loc.locationCode === step.destinationCode);
                    return (
                      <span key={i}>
                        {i === 0
                          ? `${origin?.name || step.originCode} (${origin?.city || ""}) → ${destination?.name || step.destinationCode} (${destination?.city || ""})`
                          : ` → ${destination?.name || step.destinationCode} (${destination?.city || ""})`}
                        <span style={{ color: step.transportationType === "FLIGHT" ? "#E30613" : step.transportationType === "BUS" ? "#1E90FF" : step.transportationType === "UBER" ? "#32CD32" : step.transportationType === "SUBWAY" ? "#FFA500" : "#555" }}>
                          [{step.transportationType}]
                        </span>
                      </span>
                    )
                  })}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* --- LOCATIONS TAB --- */}
      {tab === 1 && (
        <Box>
          {/* Yeni lokasyon ekleme butonu */}
          <Button variant="contained" sx={{ backgroundColor: "#E30613", color: "#fff", mb: 2 }} onClick={() => { setEditLocation({ name: "", city: "", country: "", locationCode: "" }); setOpenLocationDialog(true); }}>
            Add Location
          </Button>

          {/* Lokasyon kartları */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {locations.map((loc) => (
              <Grid item xs={12} md={4} key={loc.id}>
                <Card sx={{ border: "1px solid #E30613", borderRadius: 2 }}>
                  <CardContent>
                    <Typography sx={{ fontWeight: "bold", color: "#E30613" }}>{loc.name}</Typography>
                    <Typography>{loc.city}, {loc.country}</Typography>
                    <Typography>Code: {loc.locationCode}</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button size="small" variant="contained" sx={{ mr: 1, backgroundColor: "#E30613", color: "#fff" }} onClick={() => { setEditLocation(loc); setOpenLocationDialog(true); }}>
                        Edit
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteLocation(loc.id)}>Delete</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Lokasyon ekleme/düzenleme dialogu */}
          <Dialog open={openLocationDialog} onClose={() => setOpenLocationDialog(false)}>
            <DialogTitle>{editLocation?.id ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogContent>
              <TextField label="Name" fullWidth margin="dense" value={editLocation?.name || ""} onChange={(e) => setEditLocation({ ...editLocation, name: e.target.value })} />
              <TextField label="City" fullWidth margin="dense" value={editLocation?.city || ""} onChange={(e) => setEditLocation({ ...editLocation, city: e.target.value })} />
              <TextField label="Country" fullWidth margin="dense" value={editLocation?.country || ""} onChange={(e) => setEditLocation({ ...editLocation, country: e.target.value })} />
              <TextField label="Code" fullWidth margin="dense" value={editLocation?.locationCode || ""} onChange={(e) => setEditLocation({ ...editLocation, locationCode: e.target.value })} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenLocationDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveLocation} variant="contained" sx={{ backgroundColor: "#E30613", color: "#fff" }}>Save</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* --- TRANSPORTATIONS TAB --- */}
      {tab === 2 && (
        <Box>
          {/* Yeni transportation ekleme butonu */}
          <Button variant="contained" sx={{ backgroundColor: "#E30613", color: "#fff", mb: 2 }} onClick={() => { setEditTransportation({ originCode: "", destinationCode: "", transportationType: "", operatingDays: [] }); setOpenTransportationDialog(true); }}>
            Add Transportation
          </Button>

          {/* Transportation kartları */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {transportations.map((t) => {
              const origin = locations.find((loc) => loc.locationCode === t.originCode);
              const destination = locations.find((loc) => loc.locationCode === t.destinationCode);
              return (
                <Grid item xs={12} md={4} key={t.id}>
                  <Card sx={{ border: "1px solid #E30613", borderRadius: 2 }}>
                    <CardContent>
                      <Typography sx={{ fontWeight: "bold", color: "#E30613" }}>
                        {origin ? `${origin.name} (${origin.city})` : t.originCode} → {destination ? `${destination.name} (${destination.city})` : t.destinationCode}
                      </Typography>
                      <Typography>Type: {t.transportationType}</Typography>
                      <Typography>Operating Days: {t.operatingDays?.join(", ")}</Typography>
                      <Box sx={{ mt: 1 }}>
                        <Button size="small" variant="contained" sx={{ mr: 1, backgroundColor: "#E30613", color: "#fff" }} onClick={() => { setEditTransportation({ ...t }); setOpenTransportationDialog(true); }}>
                          Edit
                        </Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteTransportation(t.id)}>Delete</Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>

          {/* Transportation ekleme/düzenleme dialogu */}
          <Dialog open={openTransportationDialog} onClose={() => setOpenTransportationDialog(false)}>
            <DialogTitle>{editTransportation?.id ? "Edit Transportation" : "Add Transportation"}</DialogTitle>
            <DialogContent>
              <Select fullWidth value={editTransportation.originCode} onChange={(e) => setEditTransportation({ ...editTransportation, originCode: e.target.value })} sx={{ mb: 2 }}>
                <MenuItem value="">Select Origin</MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.locationCode}>{loc.name} ({loc.city})</MenuItem>
                ))}
              </Select>

              <Select fullWidth value={editTransportation.destinationCode} onChange={(e) => setEditTransportation({ ...editTransportation, destinationCode: e.target.value })} sx={{ mb: 2 }}>
                <MenuItem value="">Select Destination</MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.locationCode}>{loc.name} ({loc.city})</MenuItem>
                ))}
              </Select>

              <Select fullWidth value={editTransportation.transportationType} onChange={(e) => setEditTransportation({ ...editTransportation, transportationType: e.target.value })} sx={{ mb: 2 }}>
                <MenuItem value="">Select Transportation Type</MenuItem>
                <MenuItem value="UBER">UBER</MenuItem>
                <MenuItem value="BUS">BUS</MenuItem>
                <MenuItem value="FLIGHT">FLIGHT</MenuItem>
                <MenuItem value="SUBWAY">SUBWAY</MenuItem>
              </Select>

              <Typography sx={{ mt: 1, mb: 1 }}>Operating Days (1=Mon, 7=Sun)</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {[1,2,3,4,5,6,7].map((day) => (
                  <Button key={day} variant={editTransportation.operatingDays?.includes(day) ? "contained" : "outlined"} onClick={() => {
                    let newDays = editTransportation.operatingDays || [];
                    if (newDays.includes(day)) newDays = newDays.filter(d => d !== day);
                    else newDays.push(day);
                    setEditTransportation({ ...editTransportation, operatingDays: newDays });
                  }}>{day}</Button>
                ))}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenTransportationDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveTransportation} variant="contained" sx={{ backgroundColor: "#E30613", color: "#fff" }}>Save</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Box>
  )
}

export default App;
