import React from 'react';

// X-Wing Symbols Component using the X-Wing symbols font
const XWingSymbols = ({ bonuses }) => {
  if (!bonuses) return null;

  const bonusElements = bonuses.getBonusElements ? bonuses.getBonusElements(bonuses) : [];

  const renderSymbol = (text, isRed = false) => {
    const style = {
      fontFamily: 'X-Wing-Symbols, Arial, sans-serif',
      fontSize: '16px',
      color: isRed ? '#dc3545' : '#000',
      marginRight: '4px'
    };

    return (
      <span key={text} style={style}>
        {text}
      </span>
    );
  };

  const wrappedSymbolsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2px 6px',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word'
  };

  return (
    <table style={{ 
      fontSize: '14px', 
      lineHeight: '1.5', 
      width: '100%', 
      borderCollapse: 'collapse',
      marginTop: '10px',
      tableLayout: 'fixed'
    }}>
      <tbody>
        {bonusElements.map((element, index) => {
          // Skip initiative as it's now displayed separately
          if (element.type === 'initiative') return null;
          
          return (
            <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ 
                padding: '8px 12px', 
                fontWeight: 'bold', 
                verticalAlign: 'top',
                borderRight: '1px solid #dee2e6',
                width: '100px',
                textAlign: 'right'
              }}>
                {element.label.replace(':', '')}:
              </td>
              <td style={{ 
                padding: '8px 12px', 
                verticalAlign: 'top',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word'
              }}>
                {element.type === 'slots' && (
                  <div style={wrappedSymbolsStyle}>
                    {element.items.map((item, i) => renderSymbol(item.text, item.isRed))}
                  </div>
                )}
                {element.type === 'actions' && (
                  <div style={wrappedSymbolsStyle}>
                    {element.items.map((item, i) => renderSymbol(item.text, item.isRed))}
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default XWingSymbols;