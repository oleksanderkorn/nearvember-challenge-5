import "regenerator-runtime/runtime";
import React, { useEffect, useRef, useState } from "react";
import { login, logout } from "./utils";
import {
  Typography,
  Box,
  TextField,
  Grid,
  AppBar,
  Toolbar,
  Button,
  Alert,
  Collapse,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import IconRefresh from "@mui/icons-material/Refresh";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "./global.css";
import randomWords from "random-words";
import Big from "big.js";
import axios from "axios";

import getConfig from "./config";
const { networkId } = getConfig(process.env.NODE_ENV || "testnet");

export default function App() {
  const isLoggedIn = () => window.walletConnection.isSignedIn();

  return (
    <>
      <MyAppBar />
      {isLoggedIn() ? (
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            style={{ marginTop: 65, textAlign: "center", marginRight: 20 }}
            variant="h6"
          >
            Hi {window.accountId}! Mint your Pixel Art NFT!
          </Typography>
          <MintForm />
        </Box>
      ) : (
        <Typography
          style={{ marginTop: 65, textAlign: "center", marginRight: 20 }}
          variant="h6"
        >
          Sign in to create and mint your unique Pixel Art NFT!
        </Typography>
      )}
    </>
  );
}

const capitalize = (s) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const randomString = () => capitalize(randomWords(3).join(" "));

const MintForm = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsloading] = useState(false);
  const [error, setError] = useState("");

  const [metadata, setMetadata] = useState({
    title: randomString(),
    description: "Your NFT description",
    copies: 1,
  });

  const regenerateTitle = () =>
    setMetadata((prev) => {
      return {
        ...prev,
        title: randomString(),
      };
    });

  const isFormValid = () => {
    return (
      metadata.title !== "" &&
      metadata.description !== "" &&
      metadata.copies > 0 &&
      metadata.media !== ""
    );
  };

  const randomTokenId = () => {
    const min = Math.ceil(1000);
    const max = Math.floor(10000);
    return `${Math.floor(Math.random() * (max - min) + min)}`;
  };

  const BOATLOAD_OF_GAS = Big(3)
    .times(10 ** 13)
    .toFixed();

  const nftStorageApiKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDViNDlGMUNDRmY2MGVkMWEwNDJmZEU5ODIzNDNhQTRiZWRBOUIzOTkiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzNzYxNjczMTcyNiwibmFtZSI6Im5lYXJ2ZXJtYmVyIn0.p-isz43Ls6ljKY2A9csp0dg1IKR7nWJZ687ruOmRXAk";

  const mintNft = async () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    const blob = await (await fetch(dataUrl)).blob();
    var reader = new FileReader();
    reader.onloadend = async function () {
      const response = await axios.post(
        `https://api.nft.storage/upload`,
        reader.result,
        {
          headers: { Authorization: `Bearer ${nftStorageApiKey}` },
        }
      );
      const mediaUrl = `https://${response.data.value.cid}.ipfs.dweb.link/`;
      contractCall(mediaUrl);
    };
    reader.readAsArrayBuffer(blob);
  };

  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.fillStyle = "#000000";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  }, []);

  const contractCall = (mediaUrl) => {
    window.contract
      .nft_mint(
        {
          token_id: randomTokenId(),
          receiver_id: window.accountId,
          metadata: {
            title: metadata.title,
            description: metadata.description,
            copies: metadata.copies,
            media: mediaUrl,
          },
        },
        BOATLOAD_OF_GAS,
        Big(0.01)
          .times(10 ** 24)
          .toFixed()
      )
      .then(
        (res) => {
          setIsloading(false);
          setShowNotification(true);
          setTimeout(() => {
            setShowNotification(false);
          }, 5000);
        },
        (err) => {
          setError(
            err.kind && err.kind.ExecutionError
              ? err.kind.ExecutionError
              : `${err}`
          );
          setTimeout(() => {
            setError("");
          }, 5000);
          setIsloading(false);
        }
      );
  };

  return (
    <>
      <Box autoComplete="off">
        <Grid style={{ marginTop: 10 }} container spacing={2}>
          <Grid item xs={7}>
            <TextField
              fullWidth
              id="title"
              value={metadata.title}
              onChange={(event) =>
                setMetadata((prev) => {
                  return {
                    ...prev,
                    title: event.target.value,
                  };
                })
              }
              label="Title"
              variant="outlined"
            />
          </Grid>
          <Grid
            item
            xs={1}
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={regenerateTitle}
            >
              <IconRefresh />
            </IconButton>
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              id="copies"
              label="Copies"
              variant="outlined"
              value={metadata.copies}
              onChange={(event) =>
                setMetadata((prev) => {
                  return {
                    ...prev,
                    copies: event.target.value,
                  };
                })
              }
              type="number"
              max="999"
              min="1"
            />
          </Grid>
          <Grid item xs={10}>
            <TextField
              fullWidth
              id="description"
              value={metadata.description}
              onChange={(event) =>
                setMetadata((prev) => {
                  return {
                    ...prev,
                    description: event.target.value,
                  };
                })
              }
              label="Description"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={2}>
            <Button
              fullWidth
              style={{ height: "100%" }}
              type="submit"
              variant="outlined"
              disabled={!isFormValid()}
              onClick={mintNft}
            >
              Mint
            </Button>
          </Grid>
          <Grid
            item
            xs={12}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <canvas ref={canvasRef} />
          </Grid>
          <Grid item xs={12}>
            <Collapse in={error !== ""}>
              <Alert
                severity="error"
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setError("");
                    }}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
                sx={{ mb: 2 }}
              >
                {error}
              </Alert>
            </Collapse>
          </Grid>
        </Grid>
      </Box>
      {showNotification && <Notification />}
    </>
  );
};

const MyAppBar = () => {
  const isLoggedIn = () => window.walletConnection.isSignedIn();

  return (
    <AppBar>
      <Toolbar>
        <Typography component="div" sx={{ flexGrow: 1 }}>
          NFT Minting
        </Typography>
        {isLoggedIn() ? (
          <Button onClick={logout} color="inherit">
            Log out
          </Button>
        ) : (
          <Button color="inherit" onClick={login}>
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

// this component gets rendered by App after the form is submitted
const Notification = () => {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`;
  return (
    <aside>
      <a
        target="_blank"
        rel="noreferrer"
        href={`${urlPrefix}/${window.accountId}`}
      >
        {window.accountId}
      </a>
      Mintint done.
      <a
        target="_blank"
        rel="noreferrer"
        href={`${urlPrefix}/${window.contract.contractId}`}
      >
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  );
};
