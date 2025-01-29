import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import * as XLSX from 'xlsx';

import {
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tabs,
    Tab,
    Grid
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
import RepeatIcon from '@mui/icons-material/Repeat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
    const [visitors, setVisitors] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [filteredVisitors, setFilteredVisitors] = useState([]);
    const [analytics, setAnalytics] = useState({
        totalVisitors: 0,
        repeatVisitors: 0,
        monthlyTrend: [],
        weeklyTrend: [],
        yearlyTrend: [],
        visitorsByPurpose: []
    });
    const [totalVisitorsInPeriod, setTotalVisitorsInPeriod] = useState(0);
    useEffect(() => {
        fetchVisitorData();
    }, []);

    useEffect(() => {
        filterVisitorsByActiveView();
        
    }, [activeTab, selectedYear, selectedMonth, visitors]);

    const fetchVisitorData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/visitors/all');
            const data = await response.json();
            setVisitors(data);
            processAnalytics(data);
        } catch (error) {
            console.error('Error fetching visitor data:', error);
        }
    };

    const filterVisitorsByActiveView = () => {
        let filtered = [...visitors];
        let totalVisitors = 0;  // Variable to calculate total visitors
        if (activeTab === 0) { // Monthly view
            filtered = visitors.filter(visitor => {
                const visitDate = new Date(visitor.checkInDate);
                if (visitDate.getFullYear() === selectedYear) {
                    totalVisitors++;
                    return true;
                }
                return false;
            });
        } else if (activeTab === 1) { // Weekly view
            filtered = visitors.filter(visitor => {
                const visitDate = new Date(visitor.checkInDate);
                if (visitDate.getFullYear() === selectedYear && visitDate.getMonth() === selectedMonth) {
                    totalVisitors++;
                    return true;
                }
                return false;
            });
        }

        setFilteredVisitors(filtered);
        setTotalVisitorsInPeriod(totalVisitors);
        processAnalytics(filtered);
    };

    const processAnalytics = (data) => {
        const uniqueVisitors = new Set(data.map(visitor => visitor.name));
        const visitorCounts = data.reduce((acc, visitor) => {
            acc[visitor.name] = (acc[visitor.name] || 0) + 1;
            return acc;
        }, {});

        const repeatVisitors = Object.values(visitorCounts).filter(count => count > 1).length;

        setAnalytics({
            totalVisitors: uniqueVisitors.size,
            repeatVisitors,
            monthlyTrend: processMonthlyTrend(data),
            weeklyTrend: processWeeklyTrend(data),
            yearlyTrend: processYearlyTrend(data),
            visitorsByPurpose: processPurposeData(data)
        });
    };

    const processMonthlyTrend = (data) => {
        // Create an array for all months to ensure complete sequence
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const months = monthNames.reduce((acc, month) => {
            acc[month] = 0;
            return acc;
        }, {});

        // Count visitors for each month
        data.forEach(visitor => {
            const visitDate = new Date(visitor.checkInDate);
            if (visitDate.getFullYear() === selectedYear) {
                const month = visitDate.toLocaleString('default', { month: 'short' });
                months[month] = (months[month] || 0) + 1;
            }
        });

        // Convert to array and maintain month order
        return monthNames.map(month => ({
            month,
            visitors: months[month]
        }));
    };

    const processWeeklyTrend = (data) => {
        // Initialize array for all possible weeks in a month
        const weeks = Array.from({ length: 6 }, (_, i) => ({
            week: `Week ${i + 1}`,
            visitors: 0
        }));

        // Count visitors for each week
        data.forEach(visitor => {
            const visitDate = new Date(visitor.checkInDate);
            if (visitDate.getMonth() === selectedMonth &&
                visitDate.getFullYear() === selectedYear) {
                const weekNumber = getWeekNumber(visitDate);
                if (weekNumber > 0 && weekNumber <= weeks.length) {
                    weeks[weekNumber - 1].visitors++;
                }
            }
        });

        // Filter out weeks with no visitors at the end of the month
        return weeks.filter((week, index) => {
            if (index === 0) return true; // Always keep first week
            return weeks.slice(0, index + 1).some(w => w.visitors > 0);
        });
    };

    const processYearlyTrend = (data) => {
        // Get min and max years from data
        const years = data.map(visitor => new Date(visitor.checkInDate).getFullYear());
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        // Create array with all years in range
        const yearRange = Array.from(
            { length: maxYear - minYear + 1 },
            (_, i) => ({
                year: minYear + i,
                visitors: 0
            })
        );

        // Count visitors for each year
        data.forEach(visitor => {
            const year = new Date(visitor.checkInDate).getFullYear();
            const yearData = yearRange.find(y => y.year === year);
            if (yearData) {
                yearData.visitors++;
            }
        });

        return yearRange;
    };

    const getWeekNumber = (date) => {
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        return Math.ceil((date.getDate() + firstDayOfMonth.getDay()) / 7);
    };
    const processPurposeData = (data) => {
        const purposes = {};
        data.forEach(visitor => {
            purposes[visitor.reason] = (purposes[visitor.reason] || 0) + 1;
        });

        return Object.entries(purposes).map(([purpose, count]) => ({
            purpose,
            count
        }));
    };
    const exportToExcel = () => {
        const exportData = visitors.map(visitor => ({
            'Name': visitor.name,
            'Role': visitor.role,
            'Check-in Date': visitor.checkInDate,
            'Check-in Time': visitor.checkInTime,
            'Check-out Date': visitor.checkOutDate,
            'Check-out Time': visitor.checkOutTime,
            'Purpose': visitor.reason
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Visitors');

        XLSX.writeFile(wb, `Visitor_Report_${new Date().toLocaleDateString()}.xlsx`);
    };

    const processVisitorTable = (visitors) => {
        const visitorMap = new Map();

        visitors.forEach(visitor => {
            if (!visitorMap.has(visitor.name)) {
                visitorMap.set(visitor.name, {
                    name: visitor.name,
                    role: visitor.role,
                    visits: 1,
                    lastVisit: visitor.checkInDate,
                    purposes: [visitor.reason]
                });
            } else {
                const record = visitorMap.get(visitor.name);
                record.visits += 1;
                record.lastVisit = new Date(visitor.checkInDate) > new Date(record.lastVisit)
                    ? visitor.checkInDate
                    : record.lastVisit;
                record.purposes.push(visitor.reason);
            }
        });

        return Array.from(visitorMap.values());
    };

    return (
        <>
            <Navbar />
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        Visitor Reports
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={exportToExcel}
                    >
                        Export to Excel
                    </Button>
                </Box>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                <Typography variant="h4">{analytics.totalVisitors}</Typography>
                                <Typography color="textSecondary">Total Unique Visitors</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <RepeatIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                                <Typography variant="h4">{analytics.repeatVisitors}</Typography>
                                <Typography color="textSecondary">Repeat Visitors</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                </Grid>
                

                <Paper sx={{ mb: 4 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                            <Tab label="Monthly Trends" />
                            <Tab label="Weekly Trends" />
                            <Tab label="Yearly Trends" />
                        </Tabs>
                    </Box>

                    <Box sx={{ p: 3 }}>
                        {(activeTab === 0 || activeTab === 1) && (
                            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                                <FormControl sx={{ minWidth: 120 }}>
                                    <InputLabel>Year</InputLabel>
                                    <Select
                                        value={selectedYear}
                                        label="Year"
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                    >
                                        {Array.from(new Set(visitors.map(v => new Date(v.checkInDate).getFullYear())))
                                            .sort((a, b) => b - a)
                                            .map(year => (
                                                <MenuItem key={year} value={year}>{year}</MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>

                                {activeTab === 1 && (
                                    <FormControl sx={{ minWidth: 120 }}>
                                        <InputLabel>Month</InputLabel>
                                        <Select
                                            value={selectedMonth}
                                            label="Month"
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <MenuItem key={i} value={i}>
                                                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </Box>
                        )}

                        <Box sx={{ height: 400 }}>
                            <ResponsiveContainer>
                                <BarChart
                                    data={activeTab === 0 ? analytics.monthlyTrend :
                                        activeTab === 1 ? analytics.weeklyTrend :
                                            analytics.yearlyTrend}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey={activeTab === 0 ? "month" :
                                            activeTab === 1 ? "week" :
                                                "year"}
                                        tickFormatter={activeTab === 0 ? undefined :
                                            activeTab === 1 ? undefined :
                                                (value) => String(value)}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                        dataKey="visitors"
                                        fill={activeTab === 0 ? "#1976d2" :
                                            activeTab === 1 ? "#9c27b0" :
                                                "#2e7d32"}
                                        name="Number of Visitors"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Box>
                </Paper>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Total Visits</TableCell>
                                <TableCell>Last Visit Date</TableCell>
                                <TableCell>Most Common Purpose</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {processVisitorTable(filteredVisitors).map((visitor) => {
                                const purposeCount = visitor.purposes.reduce((acc, purpose) => {
                                    acc[purpose] = (acc[purpose] || 0) + 1;
                                    return acc;
                                }, {});
                                const mostCommonPurpose = Object.entries(purposeCount)
                                    .reduce((a, b) => (a[1] > b[1] ? a : b))[0];

                                return (
                                    <TableRow key={visitor.name}>
                                        <TableCell>{visitor.name}</TableCell>
                                        <TableCell>{visitor.role}</TableCell>
                                        <TableCell>{visitor.visits}</TableCell>
                                        <TableCell>
                                            {new Date(visitor.lastVisit).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{mostCommonPurpose}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </>
    );
};

export default Reports;