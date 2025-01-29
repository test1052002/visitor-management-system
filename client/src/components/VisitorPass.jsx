import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import logo from './shreya.png'
const VisitorPass = ({ visitor }) => {
  if (!visitor) return null;

  return (
    <Card
      sx={{
        width: '380px',
        padding: 3,
        boxShadow: '0px 6px 18px rgba(0, 0, 0, 0.15)',
        borderRadius: '14px',
        border: '1px solid #dcdcdc',
        background: 'linear-gradient(135deg, #ffffff 30%, #f8f9fa 100%)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0px 10px 24px rgba(0, 0, 0, 0.2)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        {/* Title Section */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
        <img
            src={logo}
            alt="Shreya Life Sciences Pvt. Ltd Roorkee"
            style={{
              width: '140px', // Adjust logo size as needed
              height: 'auto',
              marginBottom: '10px',
              marginLeft:'80px',
            }}
          />
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 'bold',
              color: '#0d47a1',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
            }}
          >
            Visitor Pass
          </Typography>
         
        </Box>

        {/* Visitor Image */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {visitor.image ? (
            <Avatar
              src={visitor.image}
              alt={visitor.name}
              sx={{
                width: 90,
                height: 90,
                border: '3px solid #1976d2',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.08)',
                },
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 90,
                height: 90,
                bgcolor: 'linear-gradient(135deg, #e0e0e0 30%, #bdbdbd 80%)',
                color: '#424242',
                fontSize: '2.8rem',
                border: '3px solid #1976d2',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.08)',
                },
              }}
            >
              {visitor.name?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
          )}
        </Box>

        {/* Visitor Details */}
        <Box sx={{ '& > div': { borderBottom: '1px solid #e0e0e0', pb: 1, mb: 1 } }}>
          {[
            { label: 'Name', value: visitor.name },
            { label: 'Role', value: visitor.role },
            { label: 'Check-in', value: `${visitor.checkInDate} ${visitor.checkInTime}` },
            { label: 'Purpose', value: visitor.reason },
          ].map((item, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 'bold', color: '#424242', fontSize: '0.9rem' }}>
                {item.label}:
              </Typography>
              <Typography sx={{ color: '#616161', fontSize: '0.9rem', fontWeight: '500' }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default VisitorPass;
