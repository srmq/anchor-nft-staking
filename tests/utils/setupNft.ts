import {
    bundlrStorage,
    keypairIdentity,
    Metaplex
  } from "@metaplex-foundation/js"
  import { createMint, getAssociatedTokenAddressSync } from "@solana/spl-token"
  import * as anchor from "@project-serum/anchor"
  import { Keypair } from '@solana/web3.js';
  
  export const setupNft = async (program, payer) => {
    console.log("payer public key is " + payer.publicKey)
    const metaplex = Metaplex.make(program.provider.connection)
      .use(keypairIdentity(payer))
      .use(bundlrStorage())
  
    const nft = await metaplex
      .nfts()
      .create({
        uri: "",
        name: "Test nft",
        sellerFeeBasisPoints: 0,
      }, {commitment: "finalized"})
  
    console.log("nft metadata pubkey: ", nft.metadataAddress.toBase58())
    console.log("nft token address: ", nft.tokenAddress.toBase58())
    const [delegatedAuthPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      program.programId
    )
    const [stakeStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [payer.publicKey.toBuffer(), nft.tokenAddress.toBuffer()],
      program.programId
    )
  
    console.log("delegated authority pda: ", delegatedAuthPda.toBase58())
    console.log("stake state pda: ", stakeStatePda.toBase58())
    const [mintAuth] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      program.programId
    )
  
    console.log("now trying to create mint, here is the payer")
    console.log(payer)
    const mint = await createMint(
      program.provider.connection,
      payer,
      mintAuth,
      null,
      2,
      Keypair.generate(),
      {commitment: "finalized"}
    )
    console.log("Mint pubkey: ", mint.toBase58())
  
    const tokenAddress = getAssociatedTokenAddressSync(mint, payer.publicKey)
    console.log("Got ATA: ", tokenAddress.toBase58())
  
    return {
      nft: nft,
      delegatedAuthPda: delegatedAuthPda,
      stakeStatePda: stakeStatePda,
      mint: mint,
      mintAuth: mintAuth,
      tokenAddress: tokenAddress,
    }
  }