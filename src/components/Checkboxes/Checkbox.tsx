import React from "react";
import {Checkbox} from "@grafana/ui";

const labeledCheckBox = ({children, ...args}) => {
      return (
          //, paddingLeft: '5px'
          <label style={{ marginRight: '1em', marginTop: '0.5em' }}>
              <Checkbox style={{padding: 0}}{...args} />
              {children}
          </label>
      );
    }

export default labeledCheckBox






