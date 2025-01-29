import * as React from 'react';
import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
import VisitorPass from './VisitorPass';
import { StyledEngineProvider, ThemeProvider, createTheme } from '@mui/material/styles';
import ReactDOM from 'react';
import { createRoot } from 'react-dom/client';
import PrintIcon from '@mui/icons-material/Print';
import { useAuth } from '@clerk/clerk-react';
import Box from '@mui/material/Box';
import Webcam from 'react-webcam';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import axios from 'axios'
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { visuallyHidden } from '@mui/utils';
import { useState, useEffect, useRef } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import EnhancedTableToolbar from './EnhancedTableToolbar'
import { EnhancedTableHead } from './EnhancedTableHead';
import { UsersIcon } from '@heroicons/react/24/outline';
function createData(id, name, imageUrl, role, checkInDate, checkInTime, checkOutDate, checkOutTime, reason) {
    return { id, name, imageUrl, role, checkInDate, checkInTime, checkOutDate, checkOutTime, reason };
}




function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}
function getComparator(order, orderBy) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}


export default function EnhancedTable() {
    const [rows, setRows] = React.useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasWebcam, setHasWebcam] = useState(false);
    const [image, setImage] = useState(null); // Stores the uploaded or captured image
    const [imageData, setImageData] = useState(null); // Base64 image data for saving
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [webcamStream, setWebcamStream] = useState(null);
    const inputFileRef = useRef(null);
    const [order, setOrder] = React.useState('desc');
    const [totalRows, setTotalRows] = useState(0); // to store total rows count
    const [orderBy, setOrderBy] = React.useState('checkInDate');
    const [selected, setSelected] = React.useState([]);
    const [editVisitor, setEditVisitor] = React.useState(null);
    const [page, setPage] = React.useState(0);
    const [dense, setDense] = React.useState(false);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [open, setOpen] = React.useState(false);
    const [opend, setOpend] = React.useState(false);
    const [alert, setAlert] = useState({ open: false, severity: '', message: '' });
    const [newVisitor, setNewVisitor] = React.useState(() => {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const currentTime = now.toTimeString().slice(0, 5); // Format: HH:MM

        return {
            name: '',
            image: '',
            role: '',
            checkInDate: currentDate,
            checkInTime: currentTime,
            checkOutDate: '',
            checkOutTime: '',
            reason: '',
        };
    });
    // Add these to your existing state declarations
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState(null);

    // Add these functions
    const handlePrintDialogOpen = (visitor) => {
        setSelectedVisitor(visitor);
        setPrintDialogOpen(true);
    };

    const handlePrintDialogClose = () => {
        setPrintDialogOpen(false);
        setSelectedVisitor(null);
    };

    const handlePrintPass = () => {
        const printContent = document.getElementById('visitor-pass-print');
        const originalContent = document.body.innerHTML;

        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
    };
    const { getToken } = useAuth();
    useEffect(() => {
        const fetchVisitors = async () => {
            const token = await getToken();
            const response = await fetch('/api/visitors', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            // Handle response
        };

        fetchVisitors();
    }, [getToken]);
    const showAlert = (severity, message) => {
        setAlert({ open: true, severity, message });
    };
    useEffect(() => {
        // Check for webcam availability
        const checkWebcam = async () => {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const webcam = devices.some(device => device.kind === 'videoinput');
            setHasWebcam(webcam);
        };
        checkWebcam();
    }, []);

    const startWebcam = async (isEdit = false) => {
        try {
            if (!hasWebcam) {
                showAlert('error', 'No webcam detected!');
                return false;
            }

            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };

            // Stop any existing stream
            if (webcamStream) {
                webcamStream.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Ensure refs are current before accessing
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                };
            } else {
                console.error('Video ref is null');
            }

            setWebcamStream(stream);
            return true;
        } catch (error) {
            console.error('Error accessing webcam:', error);
            showAlert('error', `Unable to access webcam: ${error.message}`);
            return false;
        }
    };
    // Add these imports at the top of your file


    const captureImage = async (isEdit = false) => {
        // Ensure webcam is started first
        console.log('Webcam Stream:', webcamStream);
        console.log('Video Ref:', videoRef.current);
        console.log('Canvas Ref:', canvasRef.current);
        console.log('Has Webcam:', hasWebcam);

        if (!videoRef.current || !canvasRef.current) {
            console.error('Refs are not initialized');
            showAlert('error', 'Webcam not initialized. Please start webcam first.');
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        console.log('Video Source Object:', video.srcObject);
        console.log('Video Width:', video.videoWidth);
        console.log('Video Height:', video.videoHeight);

        if (!video.srcObject || video.videoWidth === 0 || video.videoHeight === 0) {
            console.error('Video stream is not ready');
            showAlert('error', 'Video stream not ready. Please wait and try again.');
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        const capturedImage = canvas.toDataURL('image/png');
        setImage(capturedImage);
        setImageData(capturedImage);

        handleImageCapture(capturedImage, isEdit);
    };
    // Cleanup webcam stream on component unmount
    useEffect(() => {
        return () => {
            if (webcamStream) {
                webcamStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [webcamStream]);
    const handleAlertClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setAlert({ open: false, severity: '', message: '' });
    };
    const handleEdit = (visitor) => {
        setEditVisitor(visitor);
        setOpend(true);
    };
    const handleCloseEditDialog = () => {
        setOpend(false);
        setEditVisitor(null);
    };
    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelected = rows.map((n) => n.id);
            setSelected(newSelected);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }
        setSelected(newSelected);
    };
    console.log(rows.image)
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleChangeDense = (event) => {
        setDense(event.target.checked);
    };

    useEffect(() => {
        console.log('Fetching data for page:', page + 1, 'Rows per page:', rowsPerPage);  // Log page and rowsPerPage
        const fetchData = async () => {
            const response = await fetch(`http://localhost:5000/api/visitors?page=${page + 1}&limit=${rowsPerPage}`);
            const data = await response.json();

            console.log('Fetched data:', data);  // Log to verify API response

            if (data.success) {
                setRows(data.data);  // Set rows after fetching
                setTotalRows(data.pagination.total);  // Update total row count for pagination
            } else {
                console.log('No data returned from API');
            }
        };

        fetchData();
    }, [page, rowsPerPage]);  // Effect runs when either page or rowsPerPage changes



    const handleClickOpen = () => {
        setOpen(true);
        if (hasWebcam) {
            startWebcam(false);
        }
    };
    const handleClose = () => setOpen(false);
    const handlePrint = () => {
        const printContent = document.getElementById('table-to-print'); // Target table content
        const originalContent = document.body.innerHTML; // Save original page content

        // Replace the page content with the table content
        document.body.innerHTML = printContent.outerHTML;

        // Trigger the print dialog
        window.print();

        // Restore the original content after printing
        document.body.innerHTML = originalContent;
        window.location.reload(); // Optional, to reload the page after restoring content
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewVisitor((prev) => ({ ...prev, [name]: value }));

    };
    const handleChange2 = (e) => {
        const { name, value } = e.target;
        setEditVisitor((prev) => ({ ...prev, [name]: value }));
    }

    const handleSubmit = async () => {
        if (isSubmitting) return; // Prevent multiple submissions

        setIsSubmitting(true);


        const response = await fetch('http://localhost:5000/api/visitors/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...newVisitor,
                // Ensure image is included
                image: newVisitor.image || null
            }),
        });

        if (response.ok) {
            const newVisitorData = await response.json();
            setRows((prevRows) => [...prevRows, newVisitorData]);
            setOpen(false);
            showAlert('success', 'Visitor added successfully!');
            setNewVisitor({
                name: '',
                image: '',
                role: '',
                checkInDate: '',
                checkInTime: '',
                checkOutDate: '',
                checkOutTime: '',
                reason: '',
            });
        } else {
            showAlert('error', 'Failed to add visitor!');
        }
        setIsSubmitting(false);

    };
    const handleSubmit2 = async () => {
        // Send updated data to the server
        const response = await fetch(`http://localhost:5000/api/visitors/${editVisitor.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editVisitor),
        });

        if (response.ok) {
            const updatedVisitor = await response.json();
            setRows((prevRows) =>
                prevRows.map((row) => (row.id === updatedVisitor.id ? updatedVisitor : row))
            );
            const fetchData = async () => {
                const data = await fetch(`http://localhost:5000/api/visitors?page=${page + 1}&limit=${rowsPerPage}`);
                const result = await data.json();
                setRows(result.data);
                setTotalRows(result.pagination.total);  // Update pagination count
            };

            await fetchData();
            setOpend(false);
            showAlert('success', 'Visitor updated successfully!');
        } else {
            showAlert('error', 'Failed to update visitor!');
        }
    };
    const handleDelete = async () => {
        const confirmed = window.confirm('Are you sure you want to delete the selected visitors?');
        if (confirmed) {
            let successCount = 0; // Track successful deletions
            let failureCount = 0; // Track failed deletions

            // Perform deletion for each selected visitor
            const deletePromises = selected.map(async (id) => {
                const response = await fetch(`http://localhost:5000/api/visitors/${id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    successCount++;
                    console.log(`Visitor with id ${id} deleted successfully`);
                } else {
                    failureCount++;
                    console.error(`Failed to delete visitor with id ${id}`);
                }
            });

            // Wait for all delete requests to complete
            await Promise.all(deletePromises);

            // Update rows after deletion
            setRows((prevRows) => prevRows.filter((row) => !selected.includes(row.id)));
            setSelected([]); // Clear selected rows

            // Show toast messages
            if (successCount > 0) {
                showAlert('success', `${successCount} visitor(s) deleted successfully.`);
            }
            if (failureCount > 0) {
                showAlert('error', `${failureCount} visitor(s) failed to delete.`);
            }
        }
    };

    const handleImageUpload = async (event, isEdit = false) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'your_upload_preset');

            try {
                const response = await axios.post('https://api.cloudinary.com/v1_1/dytkbud8u/image/upload', formData);
                const imageUrl = response.data.secure_url;

                // Consolidate image handling logic
                if (isEdit) {
                    // For editing an existing visitor
                    const updatedVisitor = {
                        ...editVisitor,
                        image: imageUrl
                    };

                    const backendResponse = await axios.put(
                        `http://localhost:5000/api/visitors/${updatedVisitor.id}`,
                        updatedVisitor
                    );

                    setEditVisitor(backendResponse.data);
                    showAlert('success', 'Visitor updated with image');
                } else {
                    // For adding a new visitor
                    setNewVisitor(prev => ({
                        ...prev,
                        image: imageUrl  // Use functional update to ensure single value
                    }));
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                showAlert('error', 'Failed to upload image');
            }
        }
    };




    const handleImageCapture = async (base64Image, isEdit = false) => {
        try {
            // Convert base64 to file for Cloudinary upload
            const imageFile = base64ToFile(base64Image, 'captured-image.png');
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', 'your_upload_preset');

            // Upload to Cloudinary
            const response = await axios.post(
                'https://api.cloudinary.com/v1_1/dytkbud8u/image/upload',
                formData
            );
            const imageUrl = response.data.secure_url;

            // Handle image based on context (add or edit)
            if (isEdit && editVisitor) {
                // Update existing visitor
                const updatedVisitor = {
                    ...editVisitor,
                    image: imageUrl
                };

                const backendResponse = await axios.put(
                    `http://localhost:5000/api/visitors/${editVisitor.id}`,
                    updatedVisitor
                );

                // Update local state
                setRows(prevRows =>
                    prevRows.map(row =>
                        row.id === editVisitor.id ? backendResponse.data : row
                    )
                );
                setEditVisitor(backendResponse.data);
                showAlert('success', 'Visitor image updated');
            } else {
                // For new visitor
                setNewVisitor(prev => ({
                    ...prev,
                    image: imageUrl
                }));
                showAlert('success', 'Image captured for new visitor');
            }

            // Reset image state
            setImage(null);
        } catch (error) {
            console.error('Image upload error:', error);
            showAlert('error', 'Failed to upload image');
        }
    };
    function base64ToFile(base64String, filename) {
        const arr = base64String.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, { type: mime });
    }

    const handleClose2 = () => {
        setOpend(false);
        setEditVisitor(null);
    };
    console.log([...rows])
    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;
    const visibleRows = React.useMemo(() => {
        console.log('Rows:', rows);  // Log rows for debugging
        const startIndex = 0;  // Calculate start index based on page
        const endIndex = rows.length;
        console.log(startIndex, endIndex, rows.length);
        // Ensure you're slicing within available rows
        const slicedRows = rows.slice(startIndex, endIndex);  // Ensure no out-of-bound errors
        console.log('Visible rows:', slicedRows);  // Log visible rows


        return slicedRows;
    }, [page, rowsPerPage, rows]);  // Recalculate whenever page or rowsPerPage or rows change

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, pr: 2, pb: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleClickOpen} sx={{ mr: 2 }}>
                        Add Visitor
                    </Button>
                    <Button variant="contained" color="secondary" onClick={handlePrint}>
                        Print
                    </Button>
                </Box>
            </Box>
            <Snackbar
                open={alert.open}
                autoHideDuration={3000}
                onClose={handleAlertClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MuiAlert
                    onClose={handleAlertClose}
                    severity={alert.severity}
                    sx={{ width: '100%' }}
                    elevation={6}
                    variant="filled"
                >
                    {alert.message}
                </MuiAlert>
            </Snackbar>

            <Box id="table-to-print">
                <Paper sx={{ width: '100%', mb: 2 }}>
                    <EnhancedTableToolbar numSelected={selected.length} onDelete={handleDelete} />
                    <TableContainer>
                        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={dense ? 'small' : 'medium'}>
                            <EnhancedTableHead
                                numSelected={selected.length}
                                order={order}
                                orderBy={orderBy}
                                onSelectAllClick={handleSelectAllClick}
                                onRequestSort={handleRequestSort}
                                rowCount={rows.length}
                            />
                            <TableBody>
                                {visibleRows.map((row, index) => {
                                    const isItemSelected = selected.includes(row.id);
                                    const labelId = `enhanced-table-checkbox-${index}`;
                                    return (
                                        <TableRow hover onClick={(event) => handleClick(event, row.id)} role="checkbox" aria-checked={isItemSelected} tabIndex={-1} key={row.id} selected={isItemSelected}>
                                            <TableCell padding="checkbox">
                                                <Checkbox color="primary" checked={isItemSelected} inputProps={{ 'aria-labelledby': labelId }} />
                                            </TableCell>
                                            <TableCell component="th" id={labelId} scope="row" padding="none">
                                                {row.name}
                                            </TableCell>
                                            <TableCell align="center">
                                                {row.image ? (
                                                    <img
                                                        src={row.image}
                                                        alt="Visitor"
                                                        style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                                                    />
                                                ) : (
                                                    <UsersIcon />
                                                )}
                                            </TableCell>

                                            <TableCell align="center">{row.role}</TableCell>
                                            <TableCell align="center">{row.checkInDate}</TableCell>
                                            <TableCell align="center">{row.checkInTime}</TableCell>
                                            <TableCell align="center">{row.checkOutDate}</TableCell>
                                            <TableCell align="center">{row.checkOutTime}</TableCell>
                                            <TableCell align="center">{row.reason}</TableCell>
                                            <TableCell>
                                                <Button
                                                    sx={{
                                                        backgroundColor: 'green',
                                                        color: 'white',
                                                        marginRight: '8px',
                                                        '&:hover': {
                                                            backgroundColor: 'darkgreen',
                                                        },
                                                    }}
                                                    onClick={() => handleEdit(row)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    sx={{
                                                        backgroundColor: 'blue',
                                                        color: 'white',
                                                        '&:hover': {
                                                            backgroundColor: 'darkblue',
                                                        },
                                                    }}
                                                    onClick={() => handlePrintDialogOpen(row)}
                                                >
                                                    View Pass
                                                </Button>
                                            </TableCell>

                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={totalRows}
                        rowsPerPage={rowsPerPage}
                        page={page}  // Zero-based index
                        onPageChange={(event, newPage) => {
                            setPage(newPage);  // Correct page change handling
                        }}
                        onRowsPerPageChange={(event) => {
                            setRowsPerPage(parseInt(event.target.value, 10));  // Handle rows per page change
                        }}
                    />


                </Paper>
                {/* Add this before the closing </Box> tag */}
                <Dialog
                    open={printDialogOpen}
                    onClose={handlePrintDialogClose}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Visitor Pass Preview</Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handlePrintPass}
                            startIcon={<PrintIcon />}
                        >
                            Print Pass
                        </Button>
                    </DialogTitle>
                    <DialogContent>
                        <Box id="visitor-pass-print" sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <VisitorPass visitor={selectedVisitor} />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handlePrintDialogClose} color="primary">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>



            <Dialog open={open} onClose={handleClose}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', paddingTop: 3 }}>
                    <span>Add New Visitor</span>
                </DialogTitle>


                <DialogContent>
                    <TextField margin="dense" name="name" label="Name" fullWidth value={newVisitor.name} onChange={handleChange} />
                    {/* <TextField
                        margin="dense"
                        name="imageUpload"
                        label="Upload Image"
                        type="file"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        onChange={handleImageUpload}
                    /> */}

                    {/* Webcam section */}

                    <TextField margin="dense" name="role" label="Role" fullWidth value={newVisitor.role} onChange={handleChange} />
                    <TextField margin="dense" name="checkInDate" label="Check-In Date" type="date" fullWidth value={newVisitor.checkInDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                    <TextField margin="dense" name="checkInTime" label="Check-In Time" type="time" fullWidth value={newVisitor.checkInTime} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                    <TextField margin="dense" name="checkOutDate" label="Check-Out Date" type="date" fullWidth value={newVisitor.checkOutDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                    <TextField margin="dense" name="checkOutTime" label="Check-Out Time" type="time" fullWidth value={newVisitor.checkOutTime} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                    <TextField margin="dense" name="reason" label="Reason of Visit" fullWidth value={newVisitor.reason} onChange={handleChange} />
                    <input
                        type="file"
                        id="imageUpload"
                        onChange={(e) => handleImageUpload(e)}
                        accept="image/*"
                        class="hidden"
                    />
                    <label
                        htmlFor="imageUpload"
                        class="inline-block px-6 py-3 bg-blue-500 text-white text-lg rounded-md cursor-pointer hover:bg-blue-600 transition-colors">
                        Choose an image
                    </label>
                    <div
                        className="file-upload-name mt-2 text-sm text-gray-700">
                    </div>
                    {newVisitor.image && (
                        <img
                            src={newVisitor.image}
                            alt="Preview"
                            style={{ width: '100px', height: '100px' }}
                        />
                    )}
                    {hasWebcam && (
                        <div className="flex flex-col items-center space-y-4 bg-gray-100 p-4 rounded-2xl shadow-lg">
                            <div className="relative w-80 h-60 border-4 border-gray-300 rounded-lg overflow-hidden">
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay />
                                <canvas
                                    ref={canvasRef}
                                    style={{ display: 'none', width: '100%', height: '100%' }}
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    onClick={async () => await captureImage(false)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 shadow-md transition duration-300"
                                >
                                    Start Webcam
                                </button>
                                <button
                                    onClick={() => captureImage(false)}
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 shadow-md transition duration-300"
                                >
                                    Capture
                                </button>
                            </div>
                        </div>
                    )}

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">Cancel</Button>
                    <Button onClick={handleSubmit} color="primary">Add Visitor</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={opend} onClose={handleClose2}>
                <DialogTitle>Edit Visitor</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        name="name"
                        label="Name"
                        fullWidth
                        value={editVisitor?.name || ''}
                        onChange={handleChange2}
                    />
                    <TextField
                        margin="dense"
                        name="imageUpload"
                        label="Upload Image"
                        type="file"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) => handleImageUpload(e, true)}
                    />
                    {editVisitor?.image && <img src={editVisitor.image} alt="Preview" style={{ width: '100px', height: '100px', marginTop: '10px' }} />}
                    {/* Webcam section */}
                    {hasWebcam && (
                        <div className="flex flex-col items-center space-y-4 bg-gray-100 p-4 rounded-2xl shadow-lg">
                            {/* Start Webcam Button */}
                            <button
                                onClick={() => startWebcam(true)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 shadow-md transition duration-300"
                            >
                                Start Webcam
                            </button>

                            {/* Video Stream */}
                            <div className="relative w-80 h-60 border-4 border-gray-300 rounded-lg overflow-hidden">
                                <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                            </div>

                            {/* Capture Image Button */}
                            <button
                                onClick={() => captureImage(true)}

                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 shadow-md transition duration-300"
                            >
                                Capture Image
                            </button>

                            {/* Captured Image Display */}
                            {image && (
                                <div className="flex flex-col items-center space-y-2">
                                    <img
                                        src={image}
                                        alt="Captured"
                                        className="w-24 h-24 object-cover rounded-lg border border-gray-300"

                                    />
                                    <span className="text-sm text-gray-500">Captured Image</span>
                                </div>
                            )}

                            {/* Hidden Canvas */}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    )}


                    <TextField
                        margin="dense"
                        name="role"
                        label="Role"
                        fullWidth
                        value={editVisitor?.role || ''}
                        onChange={handleChange2}
                    />
                    <TextField
                        margin="dense"
                        name="checkInDate"
                        label="Check-In Date"
                        type="date"
                        fullWidth
                        value={editVisitor?.checkInDate || ''}
                        onChange={handleChange2}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        margin="dense"
                        name="checkInTime"
                        label="Check-In Time"
                        type="time"
                        fullWidth
                        value={editVisitor?.checkInTime || ''}
                        onChange={handleChange2}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        margin="dense"
                        name="checkOutDate"
                        label="Check-Out Date"
                        type="date"
                        fullWidth
                        value={editVisitor?.checkOutDate || ''}
                        onChange={handleChange2}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        margin="dense"
                        name="checkOutTime"
                        label="Check-Out Time"
                        type="time"
                        fullWidth
                        value={editVisitor?.checkOutTime || ''}
                        onChange={handleChange2}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        margin="dense"
                        name="reason"
                        label="Reason of Visit"
                        fullWidth
                        value={editVisitor?.reason || ''}
                        onChange={handleChange2}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose2} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit2} color="primary">
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}